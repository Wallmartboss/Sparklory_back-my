import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

/**
 * Category document
 * Contains category name and image
 */
@Schema({ collection: 'categories', versionKey: false })
export class Category {
  /** Category name */
  @ApiProperty({
    example: 'earrings',
    description: 'Category name',
  })
  @Prop({ required: true, unique: true })
  name: string;

  /** Category image URL (optional) */
  @ApiProperty({
    example: 'https://example.com/category-image.jpg',
    description: 'Category image URL (optional)',
    required: false,
  })
  @Prop({ required: false })
  image?: string;

  /** Parent category (null if root category) */
  @ApiProperty({
    example: null,
    description:
      'Parent category name (null for main category, or name of parent category for subcategory)',
    required: false,
    nullable: true,
  })
  @Prop({ type: String, default: null })
  parentCategory?: string | null;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
