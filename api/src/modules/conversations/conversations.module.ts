/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { ConversationsRepository } from './repositories/conversations.repository';

@Module({
  controllers: [ConversationsController],
  providers: [
    ConversationsService,
    ConversationsRepository,
  ],
})
export class ConversationsModule {}
