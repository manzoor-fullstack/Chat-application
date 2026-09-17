import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetMessagesDto {
  @ApiPropertyOptional({
    example: 30,
    description: 'Number of messages to return',
    default: 30,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 30;

  @ApiPropertyOptional({
    example: '064becf5-a76f-4992-b621-c5187623d0fa',
    description: 'Message ID used as the pagination cursor',
  })
  @IsOptional()
  @IsUUID()
  cursor?: string;
}
