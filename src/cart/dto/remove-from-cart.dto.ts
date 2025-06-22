import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RemoveFromCartDto {
  @ApiProperty({
    description: 'The ID of the product to remove from the cart',
    example: '60d21b4667d0d8992e610c85',
  })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'The size of the product to remove',
    example: '17.5',
    required: false,
  })
  @IsString()
  @IsOptional()
  size?: string;

  @ApiProperty({
    description: 'The color of the product to remove',
    example: 'gold',
    required: false,
  })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({
    example: 'c0a8012e-7b2a-4c1a-9e2a-123456789abc',
    required: false,
    description: 'Guest cart/session ID',
  })
  @IsOptional()
  @IsString()
  guestId?: string;
}
