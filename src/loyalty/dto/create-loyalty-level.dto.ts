import { ApiProperty } from '@nestjs/swagger';

export class CreateLoyaltyLevelDto {
  @ApiProperty({ example: 'Silver', description: 'Назва рівня лояльності' })
  name: string;

  @ApiProperty({
    example: 0.05,
    description: 'Відсоток бонусу (наприклад, 0.05 для 5%)',
  })
  bonusPercent: number;
}
