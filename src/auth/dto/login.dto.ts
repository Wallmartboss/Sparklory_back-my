import { CreateUserDto } from '@/user/dto/create-user.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LoginDto extends CreateUserDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  newDeviceCode?: string;
}
