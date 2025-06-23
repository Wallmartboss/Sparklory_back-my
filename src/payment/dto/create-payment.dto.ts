import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class GuestContactInfoDto {
  @ApiProperty({
    example: 'Ivan Ivanov',
    required: false,
    description: 'Guest full name',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'ivan@example.com',
    required: false,
    description: 'Guest email address',
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: '+380123456789',
    required: false,
    description: 'Guest phone number',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: 'Kyiv, Ukraine',
    required: false,
    description: 'Guest address',
  })
  @IsString()
  @IsOptional()
  address?: string;
}

export class CreatePaymentDto {
  @ApiProperty({ example: 12900, description: 'Payment amount' })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({
    example: 'c0a8012e-7b2a-4c1a-9e2a-123456789abc',
    required: false,
    description: 'Guest cart/session ID',
  })
  @IsOptional()
  @IsString()
  guestId?: string;

  @ApiProperty({
    type: GuestContactInfoDto,
    required: false,
    description: 'Guest contact information',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => GuestContactInfoDto)
  contactInfo?: GuestContactInfoDto;
}
