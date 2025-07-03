import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CartItem } from '../cart/cart.schema';

/**
 * PurchaseHistory — історія покупок користувача
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

  @Prop({ type: String, required: true })
  orderId: string;

  @Prop({
    type: [Object], // Mongoose не підтримує пряму ссилку на клас, але для TS вкажемо CartItem[]
    required: true,
  })
  items: CartItem[];
}

export const PurchaseHistorySchema =
  SchemaFactory.createForClass(PurchaseHistory);

// ЯВНО вказую ім'я колекції, щоб уникнути проблем з pluralization
PurchaseHistorySchema.set('collection', 'purchasehistories');

PurchaseHistorySchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

// Логуємо всі дані перед валідацією (спрацьовує для create)
PurchaseHistorySchema.pre('validate', function (next) {
  console.log(
    '[GLOBAL LOG][PurchaseHistorySchema] validate:',
    JSON.stringify(this, null, 2),
  );
  next();
});

// Логуємо всі дані при масовому додаванні (insertMany)
PurchaseHistorySchema.pre('insertMany', function (docs, next) {
  if (Array.isArray(docs)) {
    docs.forEach(doc => {
      console.log(
        '[GLOBAL LOG][PurchaseHistorySchema] insertMany:',
        JSON.stringify(doc, null, 2),
      );
    });
  }
  next();
});
