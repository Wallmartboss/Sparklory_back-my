import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

/**
 * DTO to change the current user's password by providing the previous password.
 */
export class ChangePasswordDto {
  /**
   * Previous password (for verification)
   */
  @ApiProperty({ example: 'oldP@ssw0rd' })
  @IsString()
  previousPassword!: string;

  /**
   * New password to set
   */
  @ApiProperty({ example: 'N3wStr0ngP@ss' })
  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword!: string;
}
