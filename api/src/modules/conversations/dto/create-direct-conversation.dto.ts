/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateDirectConversationDto {
  @ApiProperty({
    example: '064becf5-a76f-4992-b621-c5187623d0fa',
    description: 'The user you want to start a direct conversation with',
  })
  @IsUUID()
  userId: string;
}