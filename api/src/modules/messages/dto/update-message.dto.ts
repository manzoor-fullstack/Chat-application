import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateMessageDto {
  @ApiProperty({
    example: 'Updated message content',
    description: 'New text content for the message',
    minLength: 1,
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(5000)
  content: string;
}
