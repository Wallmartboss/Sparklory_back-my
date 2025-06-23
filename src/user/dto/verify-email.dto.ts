import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ example: 'example@ex.com', description: 'User email address' })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({
    example: '2344',
    description: 'Verification code sent to email',
  })
  @IsString()
  @IsNotEmpty()
  readonly code: string;
}
