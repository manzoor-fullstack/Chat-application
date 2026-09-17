import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from 'src/common/decorators/current-user.decorator';

import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

import { CreateMessageDto } from './dto/create-message.dto';
import { MessageResponseDto } from './dto/message-response.dto';

import { MessagesService } from './messages.service';
import { JwtPayload } from '../auth/services/token.service';
import { GetMessagesDto } from './dto/get-messages.dto';
import { MessagesPageDto } from './dto/messages-page.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@ApiTags('Messages')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('conversations/:conversationId/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Send a message',
  })
  @ApiCreatedResponse({
    description: 'Message created successfully',
    type: MessageResponseDto,
  })
  async createMessage(
    @CurrentUser() user: JwtPayload,
    @Param('conversationId', new ParseUUIDPipe())
    conversationId: string,
    @Body() dto: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    return this.messagesService.createMessage(conversationId, user.sub, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get messages from a conversation',
  })
  @ApiOkResponse({
    description: 'Conversation messages returned successfully',
    type: [MessageResponseDto],
  })
  async getMessages(
    @CurrentUser() user: JwtPayload,
    @Param('conversationId', new ParseUUIDPipe())
    conversationId: string,
    @Query() dto: GetMessagesDto,
  ): Promise<MessagesPageDto> {
    return this.messagesService.getMessages(conversationId, user.sub, dto);
  }

  @Patch(':messageId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Edit your message',
  })
  @ApiOkResponse({
    description: 'Message updated successfully',
    type: MessageResponseDto,
  })
  async updateMessage(
    @CurrentUser() user: JwtPayload,
    @Param('conversationId', new ParseUUIDPipe())
    conversationId: string,
    @Param('messageId', new ParseUUIDPipe())
    messageId: string,
    @Body() dto: UpdateMessageDto,
  ): Promise<MessageResponseDto> {
    return this.messagesService.updateMessage(
      conversationId,
      messageId,
      user.sub,
      dto,
    );
  }

  @Delete(':messageId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete your message',
  })
  @ApiOkResponse({
    description: 'Message deleted successfully',
    type: MessageResponseDto,
  })
  async deleteMessage(
    @CurrentUser() user: JwtPayload,
    @Param('conversationId', new ParseUUIDPipe())
    conversationId: string,
    @Param('messageId', new ParseUUIDPipe())
    messageId: string,
  ): Promise<MessageResponseDto> {
    return this.messagesService.deleteMessage(
      conversationId,
      messageId,
      user.sub,
    );
  }
}
