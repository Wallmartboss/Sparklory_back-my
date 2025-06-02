import {
  IsString,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
  image: string[];

  @ApiProperty({ example: 'false' })
  @IsBoolean()
  inStock: boolean;
}
