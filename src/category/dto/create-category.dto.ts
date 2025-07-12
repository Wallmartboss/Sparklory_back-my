import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'earrings',
    description: 'Category name',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'https://example.com/category-image.jpg',
    description: 'Category image URL',
  })
  @IsUrl()
  image: string;
}
