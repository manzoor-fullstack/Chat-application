import { ApiProperty } from '@nestjs/swagger';

export class CurrentUserResponseDto {
  @ApiProperty({
    example: '064becf5-a76f-4992-b621-c5187623d0fa',
  })
  id: string;

  @ApiProperty({
    example: 'manzoor@example.com',
  })
  email: string;

  @ApiProperty({
    example: 'manzoor',
  })
  username: string;

  @ApiProperty({
    example: null,
    nullable: true,
  })
  avatarUrl: string | null;
}