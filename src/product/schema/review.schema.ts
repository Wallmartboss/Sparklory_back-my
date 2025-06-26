import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema() // тепер схема з _id
export class Review {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  avatar?: string;

  @Prop({ required: true })
  text: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ required: true })
  createdAt: string;

  @Prop({ type: [String], default: [] })
  image?: string[];
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
