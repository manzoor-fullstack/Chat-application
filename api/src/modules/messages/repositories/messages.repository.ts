import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class MessagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMessage(data: {
    conversationId: string;
    senderId: string;
    content: string;
  }) {
    return this.prisma.message.create({
      data: {
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: data.content,
        type: 'TEXT',
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async findMessagesByConversationId(
    conversationId: string,
    limit: number,
    cursor?: string,
  ) {
    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
      },

      ...(cursor && {
        cursor: {
          id: cursor,
        },
        skip: 1,
      }),

      orderBy: {
        createdAt: 'desc',
      },

      take: limit + 1,

      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    const hasMore = messages.length > limit;

    const data = hasMore ? messages.slice(0, limit) : messages;

    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return {
      data,
      nextCursor,
      hasMore,
    };
  }

  async findMessageById(messageId: string) {
    return this.prisma.message.findUnique({
      where: {
        id: messageId,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async updateMessage(messageId: string, content: string) {
    return this.prisma.message.update({
      where: {
        id: messageId,
      },
      data: {
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async deleteMessage(messageId: string) {
    return this.prisma.message.delete({
      where: {
        id: messageId,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async createMessageRead(messageId: string, userId: string) {
    return this.prisma.messageRead.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
      create: {
        messageId,
        userId,
      },
      update: {},
    });
  }

  async findMessageRead(messageId: string, userId: string) {
    return this.prisma.messageRead.findUnique({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
    });
  }
}
