import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({
    description: 'The ID of the product to add to the cart',
    example: '60d21b4667d0d8992e610c85',
  })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'The quantity of the product to add',
    example: 1,
    required: false,
    default: 1,
  })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiProperty({
    description: 'The size of the product',
    example: '17.5',
    required: false,
  })
  @IsString()
  @IsOptional()
  size?: string;

  @ApiProperty({
    description: 'The color of the product',
    example: 'gold',
    required: false,
  })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({
    description: 'Guest cart/session ID',
    example: 'c0a8012e-7b2a-4c1a-9e2a-123456789abc',
    required: false,
  })
  @IsOptional()
  @IsString()
  guestId?: string;
}
