import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class ConversationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly userSelect = {
    id: true,
    email: true,
    username: true,
    avatarUrl: true,
  } as const;

  async findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: this.userSelect,
    });
  }

  async findUsersByIds(userIds: string[]) {
    return this.prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: this.userSelect,
    });
  }

  async findDirectConversation(userId: string, otherUserId: string) {
    return this.prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',

        participants: {
          every: {
            userId: {
              in: [userId, otherUserId],
            },
          },
        },

        AND: [
          {
            participants: {
              some: {
                userId,
              },
            },
          },
          {
            participants: {
              some: {
                userId: otherUserId,
              },
            },
          },
        ],
      },

      include: {
        participants: {
          include: {
            user: {
              select: this.userSelect,
            },
          },
          orderBy: {
            joinedAt: 'asc',
          },
        },
      },
    });
  }

  async createConversation(type: 'DIRECT' | 'GROUP', name?: string) {
    return this.prisma.conversation.create({
      data: {
        type,
        name,
      },
    });
  }

  async addParticipant(
    conversationId: string,
    userId: string,
    role: 'OWNER' | 'ADMIN' | 'MEMBER' = 'MEMBER',
  ) {
    return this.prisma.conversationParticipant.create({
      data: {
        conversationId,
        userId,
        role,
      },
      include: {
        user: {
          select: this.userSelect,
        },
      },
    });
  }

  async removeParticipant(conversationId: string, userId: string) {
    return this.prisma.conversationParticipant.delete({
      where: {
        userId_conversationId: {
          userId,
          conversationId,
        },
      },
    });
  }

  async findParticipant(conversationId: string, userId: string) {
    return this.prisma.conversationParticipant.findUnique({
      where: {
        userId_conversationId: {
          userId,
          conversationId,
        },
      },
    });
  }

  async createGroupConversation(
    name: string,
    participants: Array<{
      userId: string;
      role: 'OWNER' | 'ADMIN' | 'MEMBER';
    }>,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const conversation = await tx.conversation.create({
        data: {
          type: 'GROUP',
          name,
        },
      });

      await tx.conversationParticipant.createMany({
        data: participants.map((participant) => ({
          conversationId: conversation.id,
          userId: participant.userId,
          role: participant.role,
        })),
      });

      return conversation;
    });
  }

  async findConversationById(conversationId: string) {
    return this.prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
      include: {
        participants: {
          include: {
            user: {
              select: this.userSelect,
            },
          },
          orderBy: {
            joinedAt: 'asc',
          },
        },
      },
    });
  }

  async findUserConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
      },

      orderBy: {
        updatedAt: 'desc',
      },

      include: {
        participants: {
          include: {
            user: {
              select: this.userSelect,
            },
          },
          orderBy: {
            joinedAt: 'asc',
          },
        },
      },
    });
  }
}
