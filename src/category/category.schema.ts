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

  /** Category image URL */
  @ApiProperty({
    example: 'https://example.com/category-image.jpg',
    description: 'Category image URL',
  })
  @Prop({ required: true })
  image: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
