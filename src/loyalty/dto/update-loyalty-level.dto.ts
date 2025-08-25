import { ApiProperty } from '@nestjs/swagger';

export class UpdateLoyaltyLevelDto {
  @ApiProperty({
    example: 0.05,
    description: 'Відсоток бонусу (наприклад, 0.05 для 5%)',
  })
  bonusPercent: number;
}
