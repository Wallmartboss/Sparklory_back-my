import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * PurchaseHistory - история покупок пользователя
 */
@Schema({ timestamps: true, versionKey: false })
export class PurchaseHistory extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  date: Date;

  @Prop({ default: null })
  description?: string;
}

export const PurchaseHistorySchema =
  SchemaFactory.createForClass(PurchaseHistory);

// ЯВНО указываю имя коллекции, чтобы избежать проблем с pluralization
PurchaseHistorySchema.set('collection', 'purchasehistories');

PurchaseHistorySchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});
