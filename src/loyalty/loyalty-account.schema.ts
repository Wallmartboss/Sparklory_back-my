import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * LoyaltyAccount — бонусний рахунок користувача
 */
@Schema({ versionKey: false })
export class LoyaltyAccount extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'LoyaltyLevel', required: true })
  levelId: Types.ObjectId;

  @Prop({ default: 0 })
  totalAmount: number;

  @Prop({ default: 0 })
  bonusBalance: number;

  @Prop()
  cardNumber?: string;
}

export const LoyaltyAccountSchema =
  SchemaFactory.createForClass(LoyaltyAccount);

LoyaltyAccountSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});
