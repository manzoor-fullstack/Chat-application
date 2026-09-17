import { ApiProperty } from '@nestjs/swagger';

export class MessageSenderDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty({
    nullable: true,
  })
  avatarUrl: string | null;
}

export class MessageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({
    nullable: true,
  })
  content: string | null;

  @ApiProperty({
    enum: ['TEXT', 'IMAGE', 'FILE'],
  })
  type: 'TEXT' | 'IMAGE' | 'FILE';

  @ApiProperty()
  conversationId: string;

  @ApiProperty()
  senderId: string;

  @ApiProperty({
    type: MessageSenderDto,
  })
  sender: MessageSenderDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}