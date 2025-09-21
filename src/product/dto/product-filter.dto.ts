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
    description: 'Product category filter',
    example: 'earrings',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Product subcategory filter',
    example: 'studs',
  })
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiPropertyOptional({
    description: 'Material filter',
    example: 'gold',
  })
  @IsOptional()
  @IsString()
  material?: string;

  @ApiPropertyOptional({
    description: 'Insert filter',
    example: 'diamond',
  })
  @IsOptional()
  @IsString()
  insert?: string;

  @ApiPropertyOptional({
    description: 'Minimum stock quantity',
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  inStock?: number;

  @ApiPropertyOptional({
    description: 'Gender filter',
    example: 'female',
  })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({
    description: 'Collection filter',
    example: 'Spring 2025',
  })
  @IsOptional()
  @IsString()
  collection?: string;

  @ApiPropertyOptional({
    description: 'Size filter',
    example: '16',
  })
  @IsOptional()
  @IsString()
  size?: string;

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
