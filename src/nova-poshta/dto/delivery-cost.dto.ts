import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class DeliveryCostDto {
  @ApiProperty({
    description: 'City reference ID for delivery destination',
    example: '8d5a980d-391c-11dd-90d9-001a92567626',
  })
  @IsString()
  @IsNotEmpty()
  cityRef: string;

  @ApiProperty({
    description: 'Warehouse reference ID for delivery destination',
    example: '00000000-0000-0000-0000-000000000000',
  })
  @IsString()
  @IsNotEmpty()
  warehouseRef: string;

  @ApiProperty({
    description: 'Package weight in kg',
    example: 2.5,
  })
  @IsNumber()
  @IsPositive()
  weight: number;

  @ApiProperty({
    description:
      'Cart total amount for insurance calculation (0.5% of cart total)',
    example: 1500,
    required: false,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  cartTotal?: number;
}
