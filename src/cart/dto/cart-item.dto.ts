import { ApiProperty } from '@nestjs/swagger';

export class CartItemDto {
  @ApiProperty({
    description: 'Product ID',
    example: '60d21b4667d0d8992e610c85',
  })
  product: string;

  @ApiProperty({ description: 'Quantity', example: 1 })
  quantity: number;

  @ApiProperty({ description: 'Size', example: '17.5', required: false })
  size?: string;

  @ApiProperty({ description: 'Material', example: 'gold', required: false })
  material?: string;

  @ApiProperty({ description: 'Insert', example: 'diamond', required: false })
  insert?: string;

  @ApiProperty({ description: 'Price per item', example: 1000 })
  price: number;
}
