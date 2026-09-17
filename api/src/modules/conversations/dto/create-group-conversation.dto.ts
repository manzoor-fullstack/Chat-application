import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateGroupConversationDto {
  @ApiProperty({
    example: 'SyncSpace Developers',
    description: 'Name of the group conversation',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: ['064becf5-a76f-4992-b621-c5187623d0fa', 'another-user-uuid'],
    description:
      'User IDs to add to the group. The creator is added automatically.',
    type: [String],
    required: false,
  })
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  @IsOptional()
  memberIds?: string[];
}
