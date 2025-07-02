import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'cart', versionKey: false })
export class CartItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ default: 1 })
  quantity: number;

  @Prop({ required: false })
  size?: string;

  @Prop({ required: false })
  color?: string;

  @Prop({ required: true })
  price: number;
}

@Schema({ timestamps: true, versionKey: false })
export class Cart {
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  user?: Types.ObjectId;

  @Prop({ type: [CartItem], default: [] })
  items: CartItem[];

  @Prop({ default: false })
  isOrdered: boolean;

  @Prop({ type: String, default: '' })
  order_id: string;

  @Prop({ type: String, required: false })
  guestId?: string;

  @Prop({ type: String, required: false })
  email?: string;

  @Prop({ type: Boolean, default: false })
  reminderSent?: boolean;

  @Prop({ type: Date, default: Date.now })
  createdAt?: Date;
}

export type CartDocument = Cart & Document;
export const CartSchema = SchemaFactory.createForClass(Cart);
