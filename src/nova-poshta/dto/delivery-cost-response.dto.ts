import { ApiProperty } from '@nestjs/swagger';

export class DeliveryCostResponseDto {
  @ApiProperty({
    description: 'Delivery cost from Nova Poshta',
    example: 45.5,
  })
  deliveryCost: number;

  @ApiProperty({
    description: 'Insurance cost (0.5% of cart total)',
    example: 3.0,
  })
  insuranceCost: number;

  @ApiProperty({
    description: 'Total delivery cost including insurance',
    example: 48.5,
  })
  totalCost: number;

  @ApiProperty({
    description: 'Cart total used for insurance calculation',
    example: 1500,
  })
  cartTotal: number;

  @ApiProperty({
    description: 'Insurance percentage',
    example: 0.005,
  })
  insurancePercentage: number;
}
