import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';
import { Gender } from '../../common/enum';
import { Review, ReviewSchema } from './review.schema';

export type ProductDocument = Product & Document;

/**
 * Product variant subdocument
 * Contains material, size, stock, price, and insert for each variant
 */
@Schema({ _id: false })
export class ProductVariant {
  /** Material type (e.g., gold, silver, platinum) */
  @Prop({ required: true })
  material: string;

  /** Product size (optional) */
  @Prop({ required: false })
  size?: string;

  /** Stock quantity for this variant */
  @Prop({ required: false, type: Number })
  inStock?: number;

  /** Price for this variant (optional, overrides product price if set) */
  @Prop({ required: false, type: Number })
  price?: number;

  /** Insert type (optional, e.g., diamond, sapphire) */
  @Prop({ required: false })
  insert?: string;
}

export const ProductVariantSchema =
  SchemaFactory.createForClass(ProductVariant);

/**
 * Product document
 * Contains product info, images, actions, reviews, and variants
 */
@Schema({ collection: 'products', versionKey: false })
export class Product {
  /** Product name */
  @Prop({ required: true })
  name: string;

  /** Product description */
  @Prop()
  description: string;

  /** Product category (name) */
  @Prop({ required: true })
  category: string;

  /** Product subcategory (name, optional) */
  @Prop({ required: false })
  subcategory?: string;

  /** Product gender (male, female, unisex, kids) */
  @Prop({ type: String, enum: Gender, required: false })
  gender?: Gender;

  /** Is engraving available */
  @Prop({ default: false })
  engraving: boolean;

  /** Product images */
  @Prop({ type: [String], required: false })
  image: string[];

  /** Product actions */
  @Prop({ type: [String], default: null, required: false })
  action: string[];

  /** Product reviews */
  @Prop({ type: [ReviewSchema], default: [] })
  reviews: Review[];

  /** Product details (optional, array of strings) */
  @Prop({ type: [String], required: false })
  details?: string[];

  /** Collection name for grouping products */
  @ApiProperty({
    example: 'Spring 2025',
    required: false,
    description: 'Collection name for grouping products',
  })
  @Prop({ required: false })
  prod_collection: string;

  /** Discount percentage (0-100). If > 0, discount is always applied regardless of dates. */
  @ApiProperty({
    example: 30,
    required: false,
    description:
      'Discount percentage (0-100). If > 0, discount is always applied regardless of dates.',
  })
  @Prop({ type: Number, default: 0 })
  discount: number;

  /** Discount start date (ISO 8601, ignored if discount > 0) */
  @ApiProperty({
    example: '2025-07-10T00:00:00.000Z',
    required: false,
    description: 'Discount start date (ISO 8601, ignored if discount > 0)',
    type: String,
    format: 'date-time',
  })
  @Prop({ type: Date, required: false })
  discountStart: Date;

  /** Discount end date (ISO 8601, ignored if discount > 0) */
  @ApiProperty({
    example: '2025-07-20T23:59:59.000Z',
    required: false,
    description: 'Discount end date (ISO 8601, ignored if discount > 0)',
    type: String,
    format: 'date-time',
  })
  @Prop({ type: Date, required: false })
  discountEnd: Date;

  /** Product variants (each with its own material, size, stock, price) */
  @Prop({ type: [ProductVariantSchema], required: false })
  variants?: ProductVariant[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);
