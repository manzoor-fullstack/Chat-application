import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { MessagesRepository } from './repositories/messages.repository';
import { ConversationsRepository } from '../conversations/repositories/conversations.repository';
import { ChatGateway } from './gateways/chat.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [MessagesController],
  providers: [
    MessagesService,
    MessagesRepository,
    ConversationsRepository,
    ChatGateway,
  ],
})
export class MessagesModule {}
