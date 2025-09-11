import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * DTO for updating the current user's profile fields.
 */
export class UpdateMeDto {
  /**
   * Full name
   */
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  /**
   * New email
   */
  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  /**
   * New password
   */
  @ApiPropertyOptional({ example: 'StrongP@ssw0rd' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
