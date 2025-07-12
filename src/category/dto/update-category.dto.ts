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
    description: 'Category image URL',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  image?: string;
}
