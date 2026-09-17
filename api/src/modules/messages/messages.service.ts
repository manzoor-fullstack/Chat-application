import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ConversationsRepository } from '../conversations/repositories/conversations.repository';

import { MessagesRepository } from './repositories/messages.repository';

import { CreateMessageDto } from './dto/create-message.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { MessagesPageDto } from './dto/messages-page.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly conversationsRepository: ConversationsRepository,
  ) {}

  // Create a new message in a conversation
  async createMessage(
    conversationId: string,
    senderId: string,
    dto: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    const participant = await this.conversationsRepository.findParticipant(
      conversationId,
      senderId,
    );

    if (!participant) {
      throw new NotFoundException('Conversation not found');
    }

    const content = dto.content.trim();

    if (!content) {
      throw new BadRequestException('Message content cannot be empty');
    }

    const message = await this.messagesRepository.createMessage({
      conversationId,
      senderId,
      content,
    });

    return this.mapMessage(message);
  }

  // Get messages from a conversation with pagination
  async getMessages(
    conversationId: string,
    userId: string,
    dto: GetMessagesDto,
  ): Promise<MessagesPageDto> {
    const participant = await this.conversationsRepository.findParticipant(
      conversationId,
      userId,
    );

    if (!participant) {
      throw new NotFoundException('Conversation not found');
    }

    const page = await this.messagesRepository.findMessagesByConversationId(
      conversationId,
      dto.limit ?? 30,
      dto.cursor,
    );

    return {
      data: page.data.map((message) => this.mapMessage(message)),
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
    };
  }

  // Update a message
  async updateMessage(
    conversationId: string,
    messageId: string,
    currentUserId: string,
    dto: UpdateMessageDto,
  ): Promise<MessageResponseDto> {
    const participant = await this.conversationsRepository.findParticipant(
      conversationId,
      currentUserId,
    );

    if (!participant) {
      throw new NotFoundException('Conversation not found');
    }

    const message = await this.messagesRepository.findMessageById(messageId);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.conversationId !== conversationId) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== currentUserId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    const content = dto.content.trim();

    if (!content) {
      throw new BadRequestException('Message content cannot be empty');
    }

    const updatedMessage = await this.messagesRepository.updateMessage(
      messageId,
      content,
    );

    return this.mapMessage(updatedMessage);
  }

  // Delete a message
  async deleteMessage(
    conversationId: string,
    messageId: string,
    currentUserId: string,
  ): Promise<MessageResponseDto> {
    const participant = await this.conversationsRepository.findParticipant(
      conversationId,
      currentUserId,
    );

    if (!participant) {
      throw new NotFoundException('Conversation not found');
    }

    const message = await this.messagesRepository.findMessageById(messageId);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.conversationId !== conversationId) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== currentUserId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    const deletedMessage =
      await this.messagesRepository.deleteMessage(messageId);

    return this.mapMessage(deletedMessage);
  }

  async markMessageAsRead(
    conversationId: string,
    messageId: string,
    userId: string,
  ) {
    const participant = await this.conversationsRepository.findParticipant(
      conversationId,
      userId,
    );

    if (!participant) {
      throw new NotFoundException('Conversation not found');
    }

    const message = await this.messagesRepository.findMessageById(messageId);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.conversationId !== conversationId) {
      throw new NotFoundException('Message not found');
    }

    /**
     * The sender does not need to create a read record
     * for their own message.
     */
    if (message.senderId === userId) {
      return null;
    }

    return this.messagesRepository.createMessageRead(messageId, userId);
  }

  private mapMessage(
    message: Awaited<ReturnType<MessagesRepository['createMessage']>>,
  ): MessageResponseDto {
    return {
      id: message.id,
      content: message.content,
      type: message.type,
      conversationId: message.conversationId,
      senderId: message.senderId,
      sender: {
        id: message.sender.id,
        username: message.sender.username,
        avatarUrl: message.sender.avatarUrl,
      },
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }
}
