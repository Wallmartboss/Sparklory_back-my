import { ApiProperty } from '@nestjs/swagger';
import { CartItemDto } from './cart-item.dto';

export class CartDto {
  @ApiProperty({ type: [CartItemDto], description: 'Items in the cart' })
  items: CartItemDto[];

  @ApiProperty({ description: 'Total before discounts' })
  preTotal: number;

  @ApiProperty({ description: 'Final total after discounts and bonuses' })
  finalTotal: number;

  @ApiProperty({ description: 'Applied coupon', required: false })
  appliedCoupon?: string;

  @ApiProperty({ description: 'Applied bonuses', required: false })
  appliedBonus?: number;
}
