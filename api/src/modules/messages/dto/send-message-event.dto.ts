import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendMessageEventDto {
  conversationId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;
}
