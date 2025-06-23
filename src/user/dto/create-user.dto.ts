import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Data Transfer Object for creating a new user.
 * Contains full name, email and password fields.
 */
export class CreateUserDto {
  /**
   * User full name
   * @example "Vasyl Bordanov"
   */
  @ApiProperty({ example: 'Vasyl Bordanov' })
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * User email address
   * @example "example@gmail.com"
   */
  @ApiProperty({ example: 'example@gmail.com' })
  @IsString()
  @IsNotEmpty()
  email: string;

  /**
   * User password
   * @example "0we9r8wejfkl"
   */
  @ApiProperty({ example: '0we9r8wejfkl' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
