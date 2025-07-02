import { ApiProperty } from '@nestjs/swagger';

export class CreatePurchaseDto {
  @ApiProperty({ example: 100, description: 'Сума покупки' })
  amount: number;

  @ApiProperty({ example: 'Замовлення #123', required: false })
  description?: string;
}
