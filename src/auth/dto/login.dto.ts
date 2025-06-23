import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDTO {
  @ApiProperty({
    example: 'example@gmail.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', description: 'User password' })
  @IsString()
  password: string;
}
