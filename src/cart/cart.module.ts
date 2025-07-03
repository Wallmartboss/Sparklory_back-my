import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailService } from '../email/email.service';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { Product, ProductSchema } from '../product/schema/product.schema';
import { CartReminderService } from './cart-reminder.service';
import { CartController } from './cart.controller';
import { Cart, CartSchema } from './cart.schema';
import { CartService } from './cart.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cart.name, schema: CartSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
    forwardRef(() => LoyaltyModule),
  ],
  controllers: [CartController],
  providers: [CartService, EmailService, CartReminderService],
  exports: [CartService],
})
export class CartModule {}
