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
  @ApiProperty({ example: 'Ivan' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'avatar123.jpg', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ example: 'Чудовий товар!' })
  @IsString()
  text: string;

  @ApiProperty({ example: 5, description: 'Рейтинг від 1 до 5' })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    example: '2024-10-20T00:00:00.000Z',
    description: 'Дата у форматі ISO string',
  })
  @IsString()
  createdAt: string;

  @ApiProperty({ example: ['reviewImage1.jpg'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  image?: string[];
}
export class CreateProductDto {
  @ApiProperty({ example: 'Сережки Amethyst' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Сережки з білим золотом і аметистами' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'earrings' })
  @IsString()
  category: string;

  @ApiProperty({ example: 'white gold' })
  @IsString()
  material: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @Type(() => Boolean)
  engraving: boolean;

  @ApiProperty({ example: 1250 })
  @IsNumber()
  @Type(() => Number)
  price: number;

  @ApiProperty({ example: ['12345678.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  image?: string[];

  @ApiProperty({ example: false })
  @IsBoolean()
  @Type(() => Boolean)
  inStock: boolean;

  // Нове поле action
  @ApiProperty({ example: ['Spring sale'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  action?: string[];

  // Масив відгуків
  @ApiProperty({ type: [ReviewDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewDto)
  reviews?: ReviewDto[];
}
