import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class BulkProductQueryDto {
  @ApiProperty({
    description: 'Array of product IDs to fetch',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
  })
  @IsArray()
  @IsString({ each: true })
  productIds: string[];

  @ApiProperty({
    description: 'Fields to include in response',
    required: false,
    example: ['name', 'price', 'image', 'category'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[];

  @ApiProperty({
    description: 'Include variants data',
    required: false,
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeVariants?: boolean;

  @ApiProperty({
    description: 'Include reviews data',
    required: false,
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeReviews?: boolean;

  @ApiProperty({
    description: 'Maximum number of reviews to include per product',
    required: false,
    example: 3,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  maxReviews?: number;

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
