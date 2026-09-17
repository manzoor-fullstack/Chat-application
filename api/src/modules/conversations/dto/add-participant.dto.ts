import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddParticipantDto {
  @ApiProperty({
    example: '064becf5-a76f-4992-b621-c5187623d0fa',
    description: 'User ID to add to the conversation',
  })
  @IsUUID()
  userId: string;
}
