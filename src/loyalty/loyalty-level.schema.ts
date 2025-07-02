import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * LoyaltyLevel — рівень лояльності користувача
 */
@Schema()
export class LoyaltyLevel extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  bonusPercent: number; // Наприклад, 0.05 для 5%
}

export const LoyaltyLevelSchema = SchemaFactory.createForClass(LoyaltyLevel);
