import {
  IsString,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class ReviewDto {
  @ApiProperty({ example: 'Ivan' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'avatar123.jpg' })
  @IsString()
  @IsOptional()
  avatar: string;

  @ApiProperty({ example: 'Чудовий товар!' })
  @IsString()
  text: string;

  @ApiProperty({ example: 5, description: 'Рейтинг від 1 до 5' })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    example: '20.10.2024',
    description: 'Дата у форматі дд.мм.рррр',
  })
  @IsString()
  @IsDateString()
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

  @ApiProperty({ example: 'true' })
  @IsBoolean()
  engraving: boolean;

  @ApiProperty({ example: '1250' })
  @IsNumber()
  price: number;

  @ApiProperty({ example: ['12345678.jpg'] })
  @IsOptional()
  @IsArray({ each: true })
  image?: string[];

  @ApiProperty({ example: 'false' })
  @IsBoolean()
  inStock: boolean;

  // Нове поле action
  @ApiProperty({ example: 'Spring sale' })
  @IsOptional()
  @IsString()
  action?: string[];

  // Масив відгуків
  @ApiProperty({ type: [ReviewDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewDto)
  reviews?: ReviewDto[];
}
