import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'earrings',
    description: 'Category name',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'https://example.com/category-image.jpg',
    description: 'Category image URL (optional)',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  image?: string;

  @ApiProperty({
    example: null,
    description:
      'Parent category name (null for main category, or name of parent category for subcategory, e.g. "earrings")',
    required: false,
    nullable: true,
  })
  @IsString()
  parentCategory?: string | null;
}
