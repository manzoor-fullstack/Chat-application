import { Injectable } from '@nestjs/common';

import { PrismaService } from './database/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async getHello() {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      message: 'SyncSpace API is running',
      database: 'connected',
    };
  }
}
