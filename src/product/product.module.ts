import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryModule } from '../category/category.module';
import { EmailModule } from '../email/email.module';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import {
  ProductSubscription,
  ProductSubscriptionSchema,
} from './schema/product-subscription.schema';
import { Product, ProductSchema } from './schema/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: ProductSubscription.name, schema: ProductSubscriptionSchema },
    ]),
    CategoryModule,
    EmailModule,
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService], // Export ProductService for use in other modules
})
export class ProductModule {}
