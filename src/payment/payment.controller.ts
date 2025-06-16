import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  createPayment(@Req() req, @Body() body: { amount: number }) {
    const orderId = `order_${Date.now()}`;
    return this.paymentService.generateFormData(
      body.amount,
      orderId,
      'Оплата товаров в корзине',
    );
  }

  @Post('callback')
  handleCallback(@Body() body) {
    // Тут можно реализовать проверку сигнатуры и обработку заказа
    return { status: 'callback received' };
  }
}
