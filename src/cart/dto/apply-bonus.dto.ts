import { ApiProperty } from '@nestjs/swagger';

export class ApplyBonusDto {
  @ApiProperty({ description: 'Сума бонусів для застосування' })
  amount: number;
}
