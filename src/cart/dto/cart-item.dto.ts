import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class CartItemDto {
  @ApiProperty({ type: String, description: 'ID товара' })
  product: Types.ObjectId;

  @ApiProperty({ example: 1, description: 'Количество' })
  quantity: number;

  @ApiProperty({ example: 'M', required: false, description: 'Размер' })
  size?: string;

  @ApiProperty({ example: 'red', required: false, description: 'Цвет' })
  color?: string;

  @ApiProperty({
    example: 1000,
    description: 'Цена товара на момент добавления',
  })
  price: number;
}
