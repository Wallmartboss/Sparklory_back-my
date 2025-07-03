import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'cart', versionKey: false })
export class CartItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId; // Ідентифікатор товару

  @Prop({ default: 1 })
  quantity: number; // Кількість

  @Prop({ required: false })
  size?: string; // Розмір

  @Prop({ required: false })
  color?: string; // Колір

  @Prop({ required: true })
  price: number; // Ціна
}

@Schema({ timestamps: true, versionKey: false })
export class Cart {
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  user?: Types.ObjectId; // Ідентифікатор користувача

  @Prop({ type: [CartItem], default: [] })
  items: CartItem[]; // Масив товарів у корзині

  @Prop({ default: false })
  isOrdered: boolean; // Чи оформлене замовлення

  @Prop({ type: String, default: '' })
  order_id: string; // Ідентифікатор замовлення

  @Prop({ type: String, required: false })
  guestId?: string; // Ідентифікатор гостя

  @Prop({ type: String, required: false })
  email?: string; // Email гостя

  @Prop({ type: Boolean, default: false })
  reminderSent?: boolean; // Чи надіслано нагадування

  @Prop({ type: Date, default: Date.now })
  createdAt?: Date; // Дата створення

  @Prop({ type: String, required: false })
  appliedCoupon?: string; // Застосований купон

  @Prop({ type: Number, required: false })
  appliedBonus?: number; // Застосовані бонуси

  @Prop({ type: Number, default: 0 })
  preTotal: number; // Сума до знижок

  @Prop({ type: Number, default: 0 })
  finalTotal: number; // Підсумкова сума
}

export type CartDocument = Cart & Document;
export const CartSchema = SchemaFactory.createForClass(Cart);

CartSchema.pre('findOneAndUpdate', function (next) {
  // Логуємо всі зміни в корзині (findOneAndUpdate)
  console.log(
    '[ГЛОБАЛЬНИЙ ЛОГ][CartSchema] findOneAndUpdate:',
    this.getQuery(),
    this.getUpdate(),
  );
  next();
});
