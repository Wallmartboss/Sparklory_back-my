import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class OptimizedProductQueryDto {
  @ApiProperty({
    description:
      'Product category filter (single category or array of categories)',
    required: false,
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

  @ApiProperty({
    description:
      'Product subcategory filter (single subcategory or array of subcategories)',
    required: false,
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

  @ApiProperty({
    description: 'Material filter (single material or array of materials)',
    required: false,
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

  @ApiProperty({
    description: 'Insert filter (single insert or array of inserts)',
    required: false,
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

  @ApiProperty({
    description: 'Minimum stock quantity',
    required: false,
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  inStock?: number;

  @ApiProperty({
    description: 'Gender filter (single gender or array of genders)',
    required: false,
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

  @ApiProperty({
    description:
      'Collection filter (single collection or array of collections)',
    required: false,
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

  @ApiProperty({
    description: 'Size filter (single size or array of sizes)',
    required: false,
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

  @ApiProperty({
    description: 'Engraving filter',
    required: false,
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  engraving?: boolean;

  @ApiProperty({
    description: 'Action filter (single action or array of actions)',
    required: false,
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

  @ApiProperty({
    description: 'Has discount',
    required: false,
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  hasDiscount?: boolean;

  @ApiProperty({
    description: 'Search text',
    required: false,
    example: 'earrings gold',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Sort field',
    required: false,
    example: 'price_asc',
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiProperty({
    description: 'Page number',
    required: false,
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  page?: number;

  @ApiProperty({
    description: 'Items per page',
    required: false,
    example: 20,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  limit?: number;

  @ApiProperty({
    description: 'Fields to include in response',
    required: false,
    example: ['name', 'price', 'image'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[];

  @ApiProperty({
    description: 'Enable caching',
    required: false,
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  useCache?: boolean;
}
