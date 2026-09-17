import { ApiProperty } from '@nestjs/swagger';

import { MessageResponseDto } from './message-response.dto';

export class MessagesPageDto {
  @ApiProperty({
    type: [MessageResponseDto],
  })
  data: MessageResponseDto[];

  @ApiProperty({
    nullable: true,
    example: '064becf5-a76f-4992-b621-c5187623d0fa',
  })
  nextCursor: string | null;

  @ApiProperty({
    example: true,
  })
  hasMore: boolean;
}
