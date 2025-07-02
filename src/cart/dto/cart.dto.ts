import { ApiProperty } from '@nestjs/swagger';
import { CartItemDto } from './cart-item.dto';

export class CartDto {
  @ApiProperty({ type: [CartItemDto], description: 'Товары в корзине' })
  items: CartItemDto[];

  @ApiProperty({ example: 0, description: 'Общая сумма корзины' })
  total: number;
}
