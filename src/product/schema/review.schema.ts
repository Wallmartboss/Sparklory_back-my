import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

/**
 * Review subdocument for product
 * Contains unique _id, author name, text, rating, creation date, images, etc.
 */
@Schema()
export class Review {
  /** Unique identifier for the review */
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  /** Reviewer name */
  @Prop({ required: true })
  name: string;

  /** Reviewer avatar image */
  @Prop()
  avatar?: string;

  /** Review text */
  @Prop({ required: true })
  text: string;

  /** Rating from 1 to 5 */
  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  /** Date in ISO format */
  @Prop({ required: true })
  createdAt: string;

  /** Review images */
  @Prop({ type: [String], default: [] })
  image?: string[];
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
