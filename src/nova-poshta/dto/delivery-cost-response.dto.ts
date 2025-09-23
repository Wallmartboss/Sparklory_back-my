import { ApiProperty } from '@nestjs/swagger';

export class DeliveryCostResponseDto {
  @ApiProperty({
    description:
      'Real delivery cost from Nova Poshta API (varies by weight and route)',
    example: 67.5,
    type: 'number',
    minimum: 0,
    maximum: 1000,
    format: 'float',
  })
  deliveryCost: number;

  @ApiProperty({
    description: 'Insurance cost calculated as 0.5% of cart total',
    example: 7.5,
    type: 'number',
    minimum: 0,
    format: 'float',
  })
  insuranceCost: number;

  @ApiProperty({
    description: 'Total cost including delivery and insurance',
    example: 75.0,
    type: 'number',
    minimum: 0,
    format: 'float',
  })
  totalCost: number;

  @ApiProperty({
    description: 'Cart total amount used for insurance calculation',
    example: 1500,
    type: 'number',
    minimum: 0,
    maximum: 1000000,
    format: 'float',
  })
  cartTotal: number;

  @ApiProperty({
    description: 'Insurance percentage (always 0.005 = 0.5%)',
    example: 0.005,
    type: 'number',
    enum: [0.005],
    format: 'float',
  })
  insurancePercentage: number;
}
