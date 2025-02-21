import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ example: 'example@ex.com' })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({ example: '2344' })
  @IsString()
  @IsNotEmpty()
  readonly code: string;
}
