import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from 'src/common/decorators/current-user.decorator';

import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

import { ConversationsService } from './conversations.service';

import { CreateDirectConversationDto } from './dto/create-direct-conversation.dto';
import { ConversationResponseDto } from './dto/conversation-response.dto';
import { JwtPayload } from '../auth/services/token.service';
import { AddParticipantDto } from './dto/add-participant.dto';
import { CreateGroupConversationDto } from './dto/create-group-conversation.dto';

@ApiTags('Conversations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post('direct')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a direct conversation',
  })
  @ApiCreatedResponse({
    description: 'Direct conversation created successfully',
    type: ConversationResponseDto,
  })
  async createDirectConversation(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateDirectConversationDto,
  ): Promise<ConversationResponseDto> {
    return this.conversationsService.createDirectConversation(user.sub, dto);
  }

  // Group conversation endpoint
  @Post('group')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a group conversation',
  })
  @ApiCreatedResponse({
    description: 'Group conversation created successfully',
    type: ConversationResponseDto,
  })
  async createGroupConversation(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateGroupConversationDto,
  ): Promise<ConversationResponseDto> {
    return this.conversationsService.createGroupConversation(user.sub, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get current user conversations',
  })
  @ApiOkResponse({
    description: 'Current user conversations returned successfully',
    type: [ConversationResponseDto],
  })
  async getConversations(
    @CurrentUser() user: JwtPayload,
  ): Promise<ConversationResponseDto[]> {
    return this.conversationsService.getUserConversations(user.sub);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a conversation by ID',
  })
  @ApiOkResponse({
    description: 'Conversation returned successfully',
    type: ConversationResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Conversation not found',
  })
  @ApiForbiddenResponse({
    description: 'Conversation not found or user is not a participant',
  })
  async getConversation(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) conversationId: string,
  ): Promise<ConversationResponseDto> {
    return this.conversationsService.getConversationById(
      conversationId,
      user.sub,
    );
  }

  @Post(':id/participants')
  @ApiOperation({
    summary: 'Add a participant to a group conversation',
  })
  @ApiCreatedResponse({
    description: 'Participant added successfully',
    type: ConversationResponseDto,
  })
  async addParticipant(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) conversationId: string,
    @Body() dto: AddParticipantDto,
  ): Promise<ConversationResponseDto> {
    return this.conversationsService.addParticipant(
      conversationId,
      user.sub,
      dto,
    );
  }

  @Delete(':id/participants/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove a participant from a group conversation',
  })
  @ApiOkResponse({
    description: 'Participant removed successfully',
    type: ConversationResponseDto,
  })
  async removeParticipant(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) conversationId: string,
    @Param('userId', new ParseUUIDPipe()) targetUserId: string,
  ): Promise<ConversationResponseDto> {
    return this.conversationsService.removeParticipant(
      conversationId,
      user.sub,
      targetUserId,
    );
  }
}
