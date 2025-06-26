import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Review, ReviewSchema } from './review.schema';

export type ProductDocument = Product & Document;

/**
 * Product document
 * Contains product info, images, actions, and reviews (each review has _id, name, text, etc.)
 */
@Schema({ collection: 'products', versionKey: false })
export class Product {
  /** Product name */
  @Prop({ required: true })
  name: string;

  /** Product description */
  @Prop()
  description: string;

  /** Product category */
  @Prop({ required: true })
  category: string;

  /** Product material */
  @Prop()
  material: string;

  /** Is engraving available */
  @Prop({ default: false })
  engraving: boolean;

  /** Product size */
  @Prop()
  size: string;

  /** Product color */
  @Prop()
  color: string;

  /** Product price */
  @Prop({ required: true })
  price: number;

  /** Product images */
  @Prop({ type: [String], required: false })
  image: string[];

  /** Is product in stock */
  @Prop({ default: true })
  inStock: boolean;

  /** Product actions */
  @Prop({ type: [String], default: null, required: false })
  action: string[];

  /** Product reviews (each review contains _id, name, text, rating, createdAt, image, etc.) */
  @Prop({ type: [ReviewSchema], default: [] })
  reviews: Review[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);
