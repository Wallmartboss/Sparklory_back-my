import { ApiProperty } from '@nestjs/swagger';

export class ApplyCouponDto {
  @ApiProperty({ description: 'Код купона' })
  code: string;
}
