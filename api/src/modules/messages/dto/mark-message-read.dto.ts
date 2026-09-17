import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class MarkMessageReadDto {
  @ApiProperty({
    example: '4354ae8c-b8f3-4036-ac22-2f4ba3b6e7c5',
    description: 'Message ID to mark as read',
  })
  @IsUUID('4')
  messageId: string;
}