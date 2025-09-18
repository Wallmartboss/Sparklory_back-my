import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

/**
 * DTO for product counts query parameters
 */
export class ProductCountsQueryDto {
  /** Filter by specific category */
  @ApiPropertyOptional({
    description: 'Filter by specific category',
    example: 'earrings',
  })
  @IsOptional()
  @IsString()
  category?: string;

  /** Filter by specific subcategory */
  @ApiPropertyOptional({
    description: 'Filter by specific subcategory',
    example: 'studs',
  })
  @IsOptional()
  @IsString()
  subcategory?: string;

  /** Filter by specific material */
  @ApiPropertyOptional({
    description: 'Filter by specific material',
    example: 'gold',
  })
  @IsOptional()
  @IsString()
  material?: string;

  /** Filter by specific insert */
  @ApiPropertyOptional({
    description: 'Filter by specific insert',
    example: 'diamond',
  })
  @IsOptional()
  @IsString()
  insert?: string;

  /** Filter by specific size */
  @ApiPropertyOptional({
    description: 'Filter by specific size',
    example: 'L',
  })
  @IsOptional()
  @IsString()
  size?: string;

  /** Filter by engraving availability */
  @ApiPropertyOptional({
    description: 'Filter by engraving availability',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  engraving?: boolean;
}

/**
 * Response DTO for product counts
 */
export interface ProductCountsResponseDto {
  /** Counts grouped by category */
  category: Record<string, number>;

  /** Counts grouped by subcategory */
  subcategory: Record<string, number>;

  /** Counts grouped by material */
  material: Record<string, number>;

  /** Counts grouped by insert */
  insert: Record<string, number>;

  /** Counts grouped by size */
  size: Record<string, number>;

  /** Counts grouped by engraving */
  engraving: {
    true: number;
    false: number;
  };

  /** Total number of products */
  total: number;
}
