import { ApiProperty } from '@nestjs/swagger';

export class AddCardDto {
  @ApiProperty({
    example: '1234-5678-9012-3456',
    description: 'Номер карти лояльності',
  })
  cardNumber: string;
}
