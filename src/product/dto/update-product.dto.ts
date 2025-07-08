import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

// UpdateProductDto now supports collection, discount, discountStart, discountEnd via CreateProductDto
export class UpdateProductDto extends PartialType(CreateProductDto) {}
