import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class OptimizedProductQueryDto {
  @ApiProperty({
    description: 'Product category filter',
    required: false,
    example: 'earrings',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({
    description: 'Product subcategory filter',
    required: false,
    example: 'studs',
  })
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiProperty({
    description: 'Material filter',
    required: false,
    example: 'gold',
  })
  @IsOptional()
  @IsString()
  material?: string;

  @ApiProperty({
    description: 'Insert filter',
    required: false,
    example: 'diamond',
  })
  @IsOptional()
  @IsString()
  insert?: string;

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
    description: 'Gender filter',
    required: false,
    example: 'female',
  })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({
    description: 'Collection filter',
    required: false,
    example: 'Spring 2025',
  })
  @IsOptional()
  @IsString()
  collection?: string;

  @ApiProperty({
    description: 'Action filter',
    required: false,
    example: 'sale',
  })
  @IsOptional()
  @IsString()
  action?: string;

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
