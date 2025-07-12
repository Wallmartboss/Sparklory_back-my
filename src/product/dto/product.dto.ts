import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '../../common/enum';
import { ReviewDto } from './create-product.dto';

export class ProductVariantDto {
  /** Material type (e.g., gold, silver, platinum) */
  @ApiProperty({ example: 'gold', description: 'Material type' })
  material: string;

  /** Product size (optional) */
  @ApiProperty({ example: '18', required: false, description: 'Product size' })
  size?: string;

  /** Stock quantity for this variant */
  @ApiProperty({ example: 10, description: 'Stock quantity for this variant' })
  stock: number;

  /** Price for this variant (optional, overrides product price if set) */
  @ApiProperty({
    example: 1250,
    required: false,
    description: 'Price for this variant',
  })
  price?: number;

  /** Insert type (optional, e.g., diamond, sapphire) */
  @ApiProperty({
    example: 'diamond',
    required: false,
    description: 'Insert type (e.g., diamond, sapphire)',
  })
  insert?: string;
}

export class ProductDto {
  @ApiProperty() _id: string;
  @ApiProperty() name: string;
  @ApiProperty() description: string;
  @ApiProperty() category: string;
  @ApiProperty() engraving: boolean;
  @ApiProperty({ type: [String], required: false }) image?: string[];
  @ApiProperty({ type: [String], required: false }) action?: string[];
  @ApiProperty({ required: false }) prod_collection?: string;
  @ApiProperty({ required: false }) discount?: number;
  @ApiProperty({ required: false }) discountStart?: Date;
  @ApiProperty({ required: false }) discountEnd?: Date;
  @ApiProperty({ type: [ReviewDto], required: false }) reviews?: ReviewDto[];
  /** Subcategories of the product (optional) */
  @ApiProperty({ type: [String], required: false })
  subcategory?: string[];
  /** Gender of the product (male, female, unisex, kids) */
  @ApiProperty({ enum: Gender, required: true })
  gender: Gender;
  /** Product variants (each with its own material, size, stock, price) */
  @ApiProperty({
    type: [ProductVariantDto],
    required: true,
    description:
      'Product variants (each with its own material, size, stock, price)',
  })
  variants: ProductVariantDto[];
}
