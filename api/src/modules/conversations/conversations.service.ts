import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ConversationsRepository } from './repositories/conversations.repository';

import { CreateDirectConversationDto } from './dto/create-direct-conversation.dto';
import { ConversationResponseDto } from './dto/conversation-response.dto';
import { AddParticipantDto } from './dto/add-participant.dto';
import { CreateGroupConversationDto } from './dto/create-group-conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly conversationsRepository: ConversationsRepository,
  ) {}

  async createDirectConversation(
    currentUserId: string,
    dto: CreateDirectConversationDto,
  ): Promise<ConversationResponseDto> {
    // Prevent creating a conversation with yourself
    if (currentUserId === dto.userId) {
      throw new BadRequestException(
        'You cannot create a conversation with yourself',
      );
    }

    // Check if target user exists
    const targetUser = await this.conversationsRepository.findUserById(
      dto.userId,
    );

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Check if a direct conversation already exists
    const existingConversation =
      await this.conversationsRepository.findDirectConversation(
        currentUserId,
        dto.userId,
      );

    if (existingConversation) {
      throw new ConflictException('Direct conversation already exists');
    }

    // Create direct conversation
    const conversation =
      await this.conversationsRepository.createConversation('DIRECT');

    // Creator becomes OWNER
    await this.conversationsRepository.addParticipant(
      conversation.id,
      currentUserId,
      'OWNER',
    );

    // Other user becomes MEMBER
    await this.conversationsRepository.addParticipant(
      conversation.id,
      dto.userId,
    );

    // Load complete conversation
    const createdConversation =
      await this.conversationsRepository.findConversationById(conversation.id);

    if (!createdConversation) {
      throw new NotFoundException('Conversation could not be loaded');
    }

    return this.mapConversation(createdConversation);
  }

  async getUserConversations(
    userId: string,
  ): Promise<ConversationResponseDto[]> {
    const conversations =
      this.conversationsRepository.findUserConversations(userId);

    return (await conversations).map((conversation) =>
      this.mapConversation(conversation),
    );
  }

  //   Get conversation by id
  async getConversationById(
    conversationId: string,
    userId: string,
  ): Promise<ConversationResponseDto> {
    await this.ensureParticipant(conversationId, userId);

    const conversation =
      await this.conversationsRepository.findConversationById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return this.mapConversation(conversation);
  }

  // Add participant method
  async addParticipant(
    conversationId: string,
    currentUserId: string,
    dto: AddParticipantDto,
  ): Promise<ConversationResponseDto> {
    await this.requireAdmin(conversationId, currentUserId);

    const conversation =
      await this.conversationsRepository.findConversationById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.type === 'DIRECT') {
      throw new BadRequestException(
        'Participants cannot be added to a direct conversation',
      );
    }

    const targetUserId = dto.userId;

    if (currentUserId === targetUserId) {
      throw new BadRequestException(
        'You cannot add yourself to the conversation',
      );
    }

    const targetUser =
      await this.conversationsRepository.findUserById(targetUserId);

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const existingParticipant =
      await this.conversationsRepository.findParticipant(
        conversationId,
        targetUserId,
      );

    if (existingParticipant) {
      throw new ConflictException('User is already a participant');
    }

    await this.conversationsRepository.addParticipant(
      conversationId,
      targetUserId,
    );

    const updatedConversation =
      await this.conversationsRepository.findConversationById(conversationId);

    if (!updatedConversation) {
      throw new NotFoundException('Conversation not found');
    }

    return this.mapConversation(updatedConversation);
  }
  // Remove participant method
  async removeParticipant(
    conversationId: string,
    currentUserId: string,
    targetUserId: string,
  ): Promise<ConversationResponseDto> {
    const requester = await this.requireAdmin(conversationId, currentUserId);

    const conversation =
      await this.conversationsRepository.findConversationById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.type === 'DIRECT') {
      throw new BadRequestException(
        'Participants cannot be removed from a direct conversation',
      );
    }

    const participant = await this.conversationsRepository.findParticipant(
      conversationId,
      targetUserId,
    );

    if (!participant) {
      throw new NotFoundException('User is not a participant');
    }

    if (participant.role === 'OWNER') {
      throw new ForbiddenException('The conversation owner cannot be removed');
    }

    if (requester.role === 'ADMIN' && participant.role === 'ADMIN') {
      throw new ForbiddenException('Admins cannot remove other admins');
    }

    await this.conversationsRepository.removeParticipant(
      conversationId,
      targetUserId,
    );

    const updatedConversation =
      await this.conversationsRepository.findConversationById(conversationId);

    if (!updatedConversation) {
      throw new NotFoundException('Conversation not found');
    }

    return this.mapConversation(updatedConversation);
  }

  // Group conversation creation method
  async createGroupConversation(
    currentUserId: string,
    dto: CreateGroupConversationDto,
  ): Promise<ConversationResponseDto> {
    const memberIds = dto.memberIds ?? [];

    const uniqueMemberIds = [...new Set(memberIds)];

    if (uniqueMemberIds.length === 0) {
      throw new BadRequestException(
        'A group conversation must have at least one other member',
      );
    }

    if (uniqueMemberIds.includes(currentUserId)) {
      throw new BadRequestException(
        'You do not need to add yourself as a member',
      );
    }

    const allUserIds = [currentUserId, ...uniqueMemberIds];

    const users = await this.conversationsRepository.findUsersByIds(allUserIds);

    if (users.length !== allUserIds.length) {
      const existingUserIds = new Set(users.map((user) => user.id));

      const missingUserId = allUserIds.find((id) => !existingUserIds.has(id));

      throw new NotFoundException(`User ${missingUserId} not found`);
    }

    const conversation =
      await this.conversationsRepository.createGroupConversation(
        dto.name.trim(),
        [
          {
            userId: currentUserId,
            role: 'OWNER',
          },
          ...uniqueMemberIds.map((userId) => ({
            userId,
            role: 'MEMBER' as const,
          })),
        ],
      );

    const createdConversation =
      await this.conversationsRepository.findConversationById(conversation.id);

    if (!createdConversation) {
      throw new NotFoundException('Conversation could not be loaded');
    }

    return this.mapConversation(createdConversation);
  }

  // Mapper helper function
  private mapConversation(
    conversation: Awaited<
      ReturnType<ConversationsRepository['findConversationById']>
    >,
  ): ConversationResponseDto {
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return {
      id: conversation.id,
      type: conversation.type,
      name: conversation.name,
      imageUrl: conversation.imageUrl,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,

      participants: conversation.participants.map((participant) => ({
        id: participant.user.id,
        email: participant.user.email,
        username: participant.user.username,
        avatarUrl: participant.user.avatarUrl,
        role: participant.role,
        joinedAt: participant.joinedAt,
      })),
    };
  }

  private async ensureParticipant(conversationId: string, userId: string) {
    const participant = await this.conversationsRepository.findParticipant(
      conversationId,
      userId,
    );

    if (!participant) {
      throw new ForbiddenException(
        'You are not a participant of this conversation',
      );
    }

    return participant;
  }

  // Admin or Owner helper function
  private async requireAdmin(conversationId: string, userId: string) {
    const participant = await this.conversationsRepository.findParticipant(
      conversationId,
      userId,
    );

    if (!participant) {
      throw new NotFoundException('Conversation not found');
    }

    if (participant.role !== 'OWNER' && participant.role !== 'ADMIN') {
      throw new ForbiddenException(
        'You do not have permission to manage participants',
      );
    }

    return participant;
  }
}
