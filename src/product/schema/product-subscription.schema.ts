import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * ProductSubscription schema for notifications when product is back in stock
 */
@Schema({ timestamps: true, versionKey: false })
export class ProductSubscription {
  /** Product ID for which the user subscribes */
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  /** Email to notify */
  @Prop({ required: true })
  email: string;

  /** Whether notification was sent */
  @Prop({ default: false })
  notified: boolean;

  /** Subscription creation date (auto) */
  @Prop({ type: Date, default: Date.now })
  createdAt?: Date;
}

export type ProductSubscriptionDocument = ProductSubscription & Document;
export const ProductSubscriptionSchema =
  SchemaFactory.createForClass(ProductSubscription);
