import { ApiPropertyOptional } from '@nestjs/swagger';

export class ProductFilterDto {
  @ApiPropertyOptional({ description: 'Product category' })
  category?: string;

  @ApiPropertyOptional({ description: 'Product material (variant)' })
  material?: string;

  @ApiPropertyOptional({ description: 'Product insert (variant)' })
  insert?: string;

  @ApiPropertyOptional({
    description: 'Minimum in stock quantity (any variant)',
    type: Number,
  })
  inStock?: number;

  @ApiPropertyOptional({
    description: 'Sort by field (e.g. price_desc, price_asc)',
  })
  sort?: string;

  @ApiPropertyOptional({
    description: 'Number of products per page',
    type: Number,
  })
  limit?: number;

  @ApiPropertyOptional({ description: 'Page number', type: Number })
  page?: number;
}
