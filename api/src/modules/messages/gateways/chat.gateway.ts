import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { isUUID } from 'class-validator';
import { Server } from 'socket.io';

import { TokenService } from 'src/modules/auth/services/token.service';
import { ConversationsRepository } from 'src/modules/conversations/repositories/conversations.repository';

import { MessagesService } from '../messages.service';
import { AuthenticatedSocket } from '../types/chat-socket.types';
import { SendMessagePayload } from '../types/message-socket.types';
import { TypingPayload } from '../types/presence-socket.types';

interface ConversationEventPayload {
  conversationId: string;
}

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  /**
   * Tracks every active socket for each user.
   *
   * One user can have multiple sockets:
   * - multiple browser tabs
   * - multiple devices
   *
   * User is considered online while at least one socket exists.
   */
  private readonly userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly tokenService: TokenService,
    private readonly conversationsRepository: ConversationsRepository,
    private readonly messagesService: MessagesService,
  ) {}

  // =========================================================
  // CONNECTION / AUTH
  // =========================================================

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = this.extractToken(client);

      if (!token) {
        this.logger.warn(`Socket ${client.id} rejected: missing token`);

        client.disconnect(true);
        return;
      }

      const payload = await this.tokenService.verifyAccessToken(token);

      client.data.user = payload;

      const becameOnline = this.addUserSocket(payload.sub, client.id);

      this.logger.log(`Socket ${client.id} connected for user ${payload.sub}`);

      client.emit('connection:ready', {
        userId: payload.sub,
      });

      /**
       * Only emit user:online when this is the user's
       * first active socket.
       *
       * If the same user opens another tab/device,
       * we don't emit online again.
       */
      if (becameOnline) {
        this.server.emit('user:online', {
          userId: payload.sub,
        });
      }
    } catch {
      this.logger.warn(`Socket ${client.id} rejected: invalid token`);

      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.data?.user?.sub;

    if (!userId) {
      this.logger.log(`Socket ${client.id} disconnected`);

      return;
    }

    /**
     * Only emit offline when the user's LAST socket
     * has disconnected.
     */
    const becameOffline = this.removeUserSocket(userId, client.id);

    if (becameOffline) {
      this.server.emit('user:offline', {
        userId,
      });
    }

    this.logger.log(`Socket ${client.id} disconnected for user ${userId}`);
  }

  // =========================================================
  // PRESENCE STATE
  // =========================================================

  private addUserSocket(userId: string, socketId: string): boolean {
    let sockets = this.userSockets.get(userId);

    const wasOffline = !sockets || sockets.size === 0;

    if (!sockets) {
      sockets = new Set<string>();
      this.userSockets.set(userId, sockets);
    }

    sockets.add(socketId);

    return wasOffline;
  }

  private removeUserSocket(userId: string, socketId: string): boolean {
    const sockets = this.userSockets.get(userId);

    if (!sockets) {
      return false;
    }

    sockets.delete(socketId);

    /**
     * User is offline only when there are no
     * remaining sockets.
     */
    if (sockets.size === 0) {
      this.userSockets.delete(userId);
      return true;
    }

    return false;
  }

  @SubscribeMessage('presence:list')
  handlePresenceList(@ConnectedSocket() client: AuthenticatedSocket) {
    return {
      userIds: Array.from(this.userSockets.keys()),
    };
  }

  // =========================================================
  // TYPING
  // =========================================================

  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @ConnectedSocket()
    client: AuthenticatedSocket,
    @MessageBody()
    payload: TypingPayload,
  ) {
    const userId = client.data.user.sub;

    if (!payload?.conversationId) {
      client.emit('typing:error', {
        message: 'conversationId is required',
      });

      return;
    }

    if (!isUUID(payload.conversationId)) {
      client.emit('typing:error', {
        message: 'Invalid conversation ID',
      });

      return;
    }

    const participant = await this.conversationsRepository.findParticipant(
      payload.conversationId,
      userId,
    );

    if (!participant) {
      client.emit('typing:error', {
        message: 'You are not a participant of this conversation',
      });

      return;
    }

    const room = this.getConversationRoom(payload.conversationId);

    /**
     * client.to(room)
     * means everyone in the room EXCEPT the sender.
     */
    client.to(room).emit('typing:start', {
      conversationId: payload.conversationId,
      userId,
    });
  }

  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @ConnectedSocket()
    client: AuthenticatedSocket,
    @MessageBody()
    payload: TypingPayload,
  ) {
    const userId = client.data.user.sub;

    if (!payload?.conversationId) {
      client.emit('typing:error', {
        message: 'conversationId is required',
      });

      return;
    }

    if (!isUUID(payload.conversationId)) {
      client.emit('typing:error', {
        message: 'Invalid conversation ID',
      });

      return;
    }

    const participant = await this.conversationsRepository.findParticipant(
      payload.conversationId,
      userId,
    );

    if (!participant) {
      client.emit('typing:error', {
        message: 'You are not a participant of this conversation',
      });

      return;
    }

    const room = this.getConversationRoom(payload.conversationId);

    client.to(room).emit('typing:stop', {
      conversationId: payload.conversationId,
      userId,
    });
  }

  // =========================================================
  // CONVERSATION ROOMS
  // =========================================================

  @SubscribeMessage('conversation:join')
  async handleJoinConversation(
    @ConnectedSocket()
    client: AuthenticatedSocket,
    @MessageBody()
    payload: ConversationEventPayload,
  ) {
    const userId = client.data.user.sub;

    if (!payload?.conversationId) {
      client.emit('conversation:error', {
        message: 'conversationId is required',
      });

      return;
    }

    if (!isUUID(payload.conversationId)) {
      client.emit('conversation:error', {
        message: 'Invalid conversation ID',
      });

      return;
    }

    const participant = await this.conversationsRepository.findParticipant(
      payload.conversationId,
      userId,
    );

    if (!participant) {
      client.emit('conversation:error', {
        message: 'You are not a participant of this conversation',
      });

      return;
    }

    const room = this.getConversationRoom(payload.conversationId);

    await client.join(room);

    client.emit('conversation:joined', {
      conversationId: payload.conversationId,
    });

    this.logger.log(`User ${userId} joined ${room}`);
  }

  @SubscribeMessage('conversation:leave')
  async handleLeaveConversation(
    @ConnectedSocket()
    client: AuthenticatedSocket,
    @MessageBody()
    payload: ConversationEventPayload,
  ) {
    const userId = client.data.user.sub;

    if (!payload?.conversationId) {
      client.emit('conversation:error', {
        message: 'conversationId is required',
      });

      return;
    }

    if (!isUUID(payload.conversationId)) {
      client.emit('conversation:error', {
        message: 'Invalid conversation ID',
      });

      return;
    }

    /**
     * Verify membership before allowing the socket
     * operation for this conversation.
     */
    const participant = await this.conversationsRepository.findParticipant(
      payload.conversationId,
      userId,
    );

    if (!participant) {
      client.emit('conversation:error', {
        message: 'You are not a participant of this conversation',
      });

      return;
    }

    const room = this.getConversationRoom(payload.conversationId);

    await client.leave(room);

    client.emit('conversation:left', {
      conversationId: payload.conversationId,
    });

    this.logger.log(`User ${userId} left ${room}`);
  }

  // =========================================================
  // REAL-TIME MESSAGES
  // =========================================================

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket()
    client: AuthenticatedSocket,
    @MessageBody()
    payload: SendMessagePayload,
  ) {
    const userId = client.data.user.sub;

    if (!payload?.conversationId) {
      client.emit('message:error', {
        message: 'conversationId is required',
      });

      return;
    }

    if (!isUUID(payload.conversationId)) {
      client.emit('message:error', {
        message: 'Invalid conversation ID',
      });

      return;
    }

    if (typeof payload.content !== 'string') {
      client.emit('message:error', {
        message: 'Message content must be a string',
      });

      return;
    }

    const content = payload.content.trim();

    if (!content) {
      client.emit('message:error', {
        message: 'Message content cannot be empty',
      });

      return;
    }

    try {
      /**
       * IMPORTANT:
       * senderId comes from the authenticated socket.
       * Never trust senderId from the client payload.
       */
      const message = await this.messagesService.createMessage(
        payload.conversationId,
        userId,
        {
          content,
        },
      );

      const room = this.getConversationRoom(payload.conversationId);

      /**
       * Broadcast canonical DB message to every
       * socket in the conversation room.
       */
      this.server.to(room).emit('message:new', message);

      return {
        success: true,
        message,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        client.emit('message:error', {
          message: 'Conversation not found',
        });

        return;
      }

      if (error instanceof BadRequestException) {
        client.emit('message:error', {
          message: error.message,
        });

        return;
      }

      this.logger.error('Failed to send message', error);

      client.emit('message:error', {
        message: 'Failed to send message',
      });
    }
  }

  // =========================================================
  // MESSAGE READ
  // =========================================================

  @SubscribeMessage('message:read')
  async handleMessageRead(
    @ConnectedSocket()
    client: AuthenticatedSocket,
    @MessageBody()
    payload: {
      conversationId: string;
      messageId: string;
    },
  ) {
    const userId = client.data.user.sub;

    if (!payload?.conversationId) {
      client.emit('message:error', {
        message: 'conversationId is required',
      });

      return;
    }

    if (!payload?.messageId) {
      client.emit('message:error', {
        message: 'messageId is required',
      });

      return;
    }

    if (!isUUID(payload.conversationId)) {
      client.emit('message:error', {
        message: 'Invalid conversation ID',
      });

      return;
    }

    if (!isUUID(payload.messageId)) {
      client.emit('message:error', {
        message: 'Invalid message ID',
      });

      return;
    }

    try {
      const read = await this.messagesService.markMessageAsRead(
        payload.conversationId,
        payload.messageId,
        userId,
      );

      /**
       * Sender does not need a read record for their own message.
       */
      if (!read) {
        return;
      }

      const room = this.getConversationRoom(payload.conversationId);

      /**
       * Notify everyone else in the conversation that
       * this user has read the message.
       */
      client.to(room).emit('message:read', {
        messageId: payload.messageId,
        conversationId: payload.conversationId,
        userId,
        readAt: read.readAt,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        client.emit('message:error', {
          message: error.message,
        });

        return;
      }

      this.logger.error('Failed to mark message as read', error);

      client.emit('message:error', {
        message: 'Failed to mark message as read',
      });
    }
  }

  // =========================================================
  // TOKEN HELPERS
  // =========================================================

  private extractToken(client: AuthenticatedSocket): string | null {
    const authToken = client.handshake.auth?.token;

    if (typeof authToken === 'string' && authToken.length > 0) {
      return this.removeBearerPrefix(authToken);
    }

    const authorization = client.handshake.headers.authorization;

    if (typeof authorization === 'string') {
      return this.removeBearerPrefix(authorization);
    }

    return null;
  }

  private removeBearerPrefix(value: string): string {
    if (value.startsWith('Bearer ')) {
      return value.slice(7);
    }

    return value;
  }

  private getConversationRoom(conversationId: string): string {
    return `conversation:${conversationId}`;
  }
}
