import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class ProductFilterDto {
  @ApiPropertyOptional({
    description:
      'Product category filter (single category or array of categories)',
    example: 'earrings',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value];
    }
    return value;
  })
  @Type(() => String)
  @IsArray()
  @IsString({ each: true })
  category?: string[];

  @ApiPropertyOptional({
    description:
      'Product subcategory filter (single subcategory or array of subcategories)',
    example: 'studs',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value];
    }
    return value;
  })
  @Type(() => String)
  @IsArray()
  @IsString({ each: true })
  subcategory?: string[];

  @ApiPropertyOptional({
    description: 'Material filter (single material or array of materials)',
    example: 'gold',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value];
    }
    return value;
  })
  @Type(() => String)
  @IsArray()
  @IsString({ each: true })
  material?: string[];

  @ApiPropertyOptional({
    description: 'Insert filter (single insert or array of inserts)',
    example: 'diamond',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value];
    }
    return value;
  })
  @Type(() => String)
  @IsArray()
  @IsString({ each: true })
  insert?: string[];

  @ApiPropertyOptional({
    description: 'Minimum stock quantity',
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  inStock?: number;

  @ApiPropertyOptional({
    description: 'Gender filter (single gender or array of genders)',
    example: 'female',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value];
    }
    return value;
  })
  @Type(() => String)
  @IsArray()
  @IsString({ each: true })
  gender?: string[];

  @ApiPropertyOptional({
    description:
      'Collection filter (single collection or array of collections)',
    example: 'Spring 2025',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value];
    }
    return value;
  })
  @Type(() => String)
  @IsArray()
  @IsString({ each: true })
  collection?: string[];

  @ApiPropertyOptional({
    description: 'Size filter (single size or array of sizes)',
    example: '16',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value];
    }
    return value;
  })
  @Type(() => String)
  @IsArray()
  @IsString({ each: true })
  size?: string[];

  @ApiPropertyOptional({
    description: 'Engraving filter',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  engraving?: boolean;

  @ApiPropertyOptional({
    description: 'Action filter (single action or array of actions)',
    example: 'sale',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value];
    }
    return value;
  })
  @Type(() => String)
  @IsArray()
  @IsString({ each: true })
  action?: string[];

  @ApiPropertyOptional({
    description: 'Minimum variant price',
    example: 500,
  })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum variant price',
    example: 5000,
  })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Has discount',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  hasDiscount?: boolean;

  @ApiPropertyOptional({
    description: 'Search text',
    example: 'earrings gold',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'price_asc',
    enum: [
      'price_asc',
      'price_desc',
      'name_asc',
      'name_desc',
      'discount_asc',
      'discount_desc',
      'created_asc',
      'created_desc',
    ],
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Fields to include in response',
    example: ['name', 'price', 'image'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[];
}
