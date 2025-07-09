import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '../../common/enum';
import { ReviewDto } from './create-product.dto';

export class ProductDto {
  @ApiProperty() _id: string;
  @ApiProperty() name: string;
  @ApiProperty() description: string;
  @ApiProperty() category: string;
  @ApiProperty() material: string;
  @ApiProperty() engraving: boolean;
  @ApiProperty({ required: false }) size?: string;
  @ApiProperty({ required: false }) color?: string;
  @ApiProperty() price: number;
  @ApiProperty({ type: [String], required: false }) image?: string[];
  @ApiProperty() inStock: boolean;
  @ApiProperty({ type: [String], required: false }) action?: string[];
  @ApiProperty({ required: false }) collection?: string;
  @ApiProperty({ required: false }) discount?: number;
  @ApiProperty({ required: false }) discountStart?: Date;
  @ApiProperty({ required: false }) discountEnd?: Date;
  @ApiProperty({ type: [ReviewDto], required: false }) reviews?: ReviewDto[];
  /** Підкатегорії продукту (опціонально) */
  @ApiProperty({ type: [String], required: false })
  subcategory?: string[];

  /** Стать продукту (male, female, unisex, kids) */
  @ApiProperty({ enum: Gender, required: true })
  gender: Gender;
}
