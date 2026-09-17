import { ApiProperty } from '@nestjs/swagger';

export class ConversationParticipantDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  username: string;

  @ApiProperty({
    nullable: true,
  })
  avatarUrl: string | null;

  @ApiProperty({
    enum: ['OWNER', 'ADMIN', 'MEMBER'],
  })
  role: 'OWNER' | 'ADMIN' | 'MEMBER';

  @ApiProperty()
  joinedAt: Date;
}

export class ConversationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({
    enum: ['DIRECT', 'GROUP'],
  })
  type: 'DIRECT' | 'GROUP';

  @ApiProperty({
    nullable: true,
  })
  name: string | null;

  @ApiProperty({
    nullable: true,
  })
  imageUrl: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({
    type: [ConversationParticipantDto],
  })
  participants: ConversationParticipantDto[];
}
