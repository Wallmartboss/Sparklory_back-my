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

  /**
   * User profile image URL (optional)
   */
  @ApiProperty({ example: 'https://example.com/image.jpg', required: false })
  image?: string;

  /**
   * Facebook ID (optional)
   */
  @ApiProperty({ example: '1234567890', required: false })
  facebookId?: string;

  /**
   * Google ID (optional)
   */
  @ApiProperty({ example: 'abcdefg123456', required: false })
  googleId?: string;

  /**
   * Is email verified (optional)
   */
  @ApiProperty({ example: true, required: false })
  isVerifyEmail?: boolean;
}
