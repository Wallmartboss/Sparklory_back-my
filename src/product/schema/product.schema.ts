import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Review } from './review.schema';

export type ProductDocument = Product & Document;

@Schema({ collection: 'products', versionKey: false })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  category: string;

  @Prop()
  material: string;

  @Prop({ default: false })
  engraving: boolean;

  @Prop({ required: true })
  price: number;

  @Prop({ type: [String], required: false })
  image: string[];

  @Prop({ default: true })
  inStock: boolean;

  @Prop({ type: [String], default: null, required: false })
  action: string;

  @Prop({ type: [Object], default: [] })
  reviews: Review[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);
