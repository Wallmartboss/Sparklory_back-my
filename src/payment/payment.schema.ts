import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, versionKey: false })
export class Payment extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  user?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Cart', required: true })
  cart: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, enum: ['pending', 'completed', 'failed'] })
  status: string;

  @Prop()
  paymentMethod: string;

  @Prop()
  transactionId: string;

  @Prop({ type: String, required: true })
  order_id: string;

  @Prop({ type: String, required: false })
  guestId?: string;

  @Prop({
    type: Object,
    required: false,
    default: null,
  })
  contactInfo?: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
