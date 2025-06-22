import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ example: 12900, description: 'Payment amount' })
  @IsNotEmpty()
  @IsNumber()
  amount: number;
}
