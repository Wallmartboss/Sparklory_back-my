import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateCategoryDto {
  @ApiProperty({
    example: 'earrings',
    description: 'Category name',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: 'https://example.com/category-image.jpg',
    description: 'Category image URL (optional)',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  image?: string;

  @ApiProperty({
    example: null, // or 'earrings' for subcategory
    description:
      'Parent category name (null for main category, or name of parent category for subcategory, e.g. "earrings")',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  parentCategory?: string | null;
}
