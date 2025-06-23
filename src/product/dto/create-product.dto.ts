import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class ReviewDto {
  @ApiProperty({ example: 'Ivan', description: 'Reviewer name' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'avatar123.jpg',
    required: false,
    description: 'Reviewer avatar image',
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ example: 'Чудовий товар!', description: 'Review text' })
  @IsString()
  text: string;

  @ApiProperty({ example: 5, description: 'Rating from 1 to 5' })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    example: '20.10.2024',
    description: 'Date in DD.MM.YYYY format',
  })
  @IsString()
  createdAt: string;

  @ApiProperty({
    example: ['reviewImage1.jpg'],
    required: false,
    description: 'Review images',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  image?: string[];
}
export class CreateProductDto {
  @ApiProperty({ example: 'Сережки Amethyst', description: 'Product name' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Сережки з білим золотом і аметистами',
    description: 'Product description',
  })
  @IsString()
  description: string;

  @ApiProperty({ example: 'earrings', description: 'Product category' })
  @IsString()
  category: string;

  @ApiProperty({ example: 'white gold', description: 'Product material' })
  @IsString()
  material: string;

  @ApiProperty({ example: true, description: 'Is engraving available' })
  @IsBoolean()
  @Type(() => Boolean)
  engraving: boolean;

  @ApiProperty({ example: '18', required: false, description: 'Product size' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiProperty({
    example: 'gold',
    required: false,
    description: 'Product color',
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ example: 1250, description: 'Product price' })
  @IsNumber()
  @Type(() => Number)
  price: number;

  @ApiProperty({
    example: ['12345678.jpg'],
    required: false,
    description: 'Product images',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  image?: string[];

  @ApiProperty({ example: false, description: 'Is product in stock' })
  @IsBoolean()
  @Type(() => Boolean)
  inStock: boolean;

  @ApiProperty({
    example: ['Spring sale'],
    required: false,
    description: 'Product actions',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  action?: string[];

  @ApiProperty({
    type: [ReviewDto],
    required: false,
    description: 'Product reviews',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewDto)
  reviews?: ReviewDto[];
}
