import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Gender } from '../../common/enum';

export class ReviewDto {
  @ApiProperty({
    example: '653e1b2c8f1b2a001e8e4c1a',
    description: 'Review unique identifier',
  })
  readonly _id?: string;

  @ApiProperty({ example: 'Ivan', description: 'Reviewer name' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'avatar123.jpg',
    required: false,
    description: 'Reviewer avatar image',
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ example: 'Чудовий товар!', description: 'Review text' })
  @IsString()
  text: string;

  @ApiProperty({ example: 5, description: 'Rating from 1 to 5' })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    example: '20.10.2024',
    description: 'Date in DD.MM.YYYY format',
  })
  @IsString()
  createdAt: string;

  @ApiProperty({
    example: ['reviewImage1.jpg'],
    required: false,
    description: 'Review images',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  image?: string[];
}

export class CreateProductDto {
  @ApiProperty({ example: 'Сережки Amethyst', description: 'Product name' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Сережки з білим золотом і аметистами',
    description: 'Product description',
  })
  @IsString()
  description: string;

  @ApiProperty({ example: 'earrings', description: 'Product category' })
  @IsString()
  category: string;

  @ApiProperty({ example: 'white gold', description: 'Product material' })
  @IsString()
  material: string;

  @ApiProperty({ example: true, description: 'Is engraving available' })
  @IsBoolean()
  @Type(() => Boolean)
  engraving: boolean;

  @ApiProperty({ example: '18', required: false, description: 'Product size' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiProperty({
    example: 'gold',
    required: false,
    description: 'Product color',
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ example: 1250, description: 'Product price' })
  @IsNumber()
  @Type(() => Number)
  price: number;

  @ApiProperty({
    example: ['12345678.jpg'],
    required: false,
    description: 'Product images',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  image?: string[];

  @ApiProperty({ example: false, description: 'Is product in stock' })
  @IsBoolean()
  @Type(() => Boolean)
  inStock: boolean;

  @ApiProperty({
    example: ['Spring sale'],
    required: false,
    description: 'Product actions',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  action?: string[];

  @ApiProperty({
    example: 'Spring 2025',
    required: false,
    description: 'Collection name for grouping products',
  })
  @IsOptional()
  @IsString()
  prod_collection?: string;

  @ApiProperty({
    example: 30,
    required: false,
    description: 'Discount percentage (0-100)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discount?: number;

  @ApiProperty({
    example: '2025-07-10T00:00:00.000Z',
    required: false,
    description: 'Discount start date (ISO 8601)',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  discountStart?: Date;

  @ApiProperty({
    example: '2025-07-20T23:59:59.000Z',
    required: false,
    description: 'Discount end date (ISO 8601)',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  discountEnd?: Date;

  /**
   * Підкатегорії продукту (опціонально)
   */
  @ApiProperty({
    example: ['casual', 'sport'],
    required: false,
    description: 'Product subcategories',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subcategory?: string[];

  /**
   * Стать продукту (male, female, unisex, kids)
   */
  @ApiProperty({
    example: Gender.Unisex,
    enum: Gender,
    required: true,
    description: 'Product gender',
    type: String,
  })
  gender: Gender;

  @ApiProperty({
    type: [ReviewDto],
    required: false,
    description:
      'Product reviews (each review contains _id, name, text, rating, createdAt, image, etc.)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewDto)
  reviews?: ReviewDto[];
}
