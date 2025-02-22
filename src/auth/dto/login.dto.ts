import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateUserDto } from 'src/user/dto/create-user.dto';

export class LoginDto extends CreateUserDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  newDeviceCode?: string;
}
