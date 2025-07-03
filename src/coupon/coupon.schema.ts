import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

/**
 * Купон на знижку для покупця
 */
@Schema({ timestamps: true })
export class Coupon extends Document {
  @ApiProperty({ description: 'Код купона', example: 'SUMMER2024' })
  @Prop({ required: true, unique: true })
  code: string; // Номер купона

  @ApiProperty({ description: 'Сума знижки', required: false, example: 100 })
  @Prop()
  amount?: number; // Номінал купона (сума)

  @ApiProperty({
    description: 'Відсоток знижки (0.05 = 5%)',
    required: false,
    example: 0.05,
  })
  @Prop()
  percent?: number; // Відсоток знижки (0.05 = 5%)

  @ApiProperty({
    description: 'Дата початку дії',
    example: '2024-06-01T00:00:00.000Z',
  })
  @Prop({ required: true })
  startDate: Date; // Дата початку дії

  @ApiProperty({
    description: 'Дата завершення дії',
    example: '2024-07-01T00:00:00.000Z',
  })
  @Prop({ required: true })
  expiryDate: Date; // Дата завершення дії
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
