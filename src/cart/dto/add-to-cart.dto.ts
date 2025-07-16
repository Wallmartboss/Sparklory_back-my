import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({
    example: '60d21b4667d0d8992e610c85',
    description: 'Product ID',
  })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 1, required: false, description: 'Quantity' })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiProperty({ example: '17.5', required: false, description: 'Size' })
  @IsString()
  @IsOptional()
  size?: string;

  @ApiProperty({ example: 'gold', required: false, description: 'Material' })
  @IsString()
  @IsOptional()
  material?: string;

  @ApiProperty({ example: 'diamond', required: false, description: 'Insert' })
  @IsString()
  @IsOptional()
  insert?: string;
}

/**
 * DTO for adding an item to the guest cart.
 * Only guestId is required in addition to product parameters.
 */
export class AddToCartGuestDto extends AddToCartDto {
  @ApiProperty({
    example: 'c0a8012e-7b2a-4c1a-9e2a-123456789abc',
    required: true,
    description: 'Guest ID',
  })
  @IsString()
  @IsNotEmpty()
  guestId: string;
}
