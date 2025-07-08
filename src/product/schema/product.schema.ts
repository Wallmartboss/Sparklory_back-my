import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
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

  /** Назва колекції, до якої належить продукт */
  @ApiProperty({
    example: 'Spring 2025',
    required: false,
    description: 'Collection name for grouping products',
  })
  @Prop({ required: false })
  collection: string;

  /** Відсоток знижки (0-100) */
  @ApiProperty({
    example: 30,
    required: false,
    description: 'Discount percentage (0-100)',
  })
  @Prop({ type: Number, default: 0 })
  discount: number;

  /** Дата початку дії знижки */
  @ApiProperty({
    example: '2025-07-10T00:00:00.000Z',
    required: false,
    description: 'Discount start date (ISO 8601)',
    type: String,
    format: 'date-time',
  })
  @Prop({ type: Date, required: false })
  discountStart: Date;

  /** Дата завершення дії знижки */
  @ApiProperty({
    example: '2025-07-20T23:59:59.000Z',
    required: false,
    description: 'Discount end date (ISO 8601)',
    type: String,
    format: 'date-time',
  })
  @Prop({ type: Date, required: false })
  discountEnd: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
