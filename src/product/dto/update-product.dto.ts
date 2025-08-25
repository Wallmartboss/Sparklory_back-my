import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

// Remove material and insert from UpdateProductDto, keep only in ProductVariantDto
export class UpdateProductDto extends PartialType(CreateProductDto) {}
