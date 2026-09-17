import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ConversationIdDto {
  @ApiProperty({
    example: '8d7af8e4-8bb1-4b40-85b8-8e4d5a8c6b32',
  })
  @IsUUID()
  id: string;
}
