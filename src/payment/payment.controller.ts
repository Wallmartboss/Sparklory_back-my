import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { User } from '@/user/schema/user.schema';
import {
  BadRequestException,
  Body,
  Controller,
  Logger,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentService } from './payment.service';

interface RequestWithUser extends Request {
  user?: User;
}

interface PaymentCallbackDto {
  data: string;
  signature: string;
}

@ApiTags('Payment')
@ApiBearerAuth('JWT-auth')
@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createPayment(
    @Req() req: RequestWithUser,
    @Body() dto: CreatePaymentDto,
  ) {
    const userId = req.user?.id;
    return this.paymentService.create(userId, dto);
  }

  @Post('create-guest')
  async createGuestPayment(@Body() dto: CreatePaymentDto) {
    return this.paymentService.create(undefined, dto);
  }

  @Post('callback')
  async handleCallback(@Body() body: PaymentCallbackDto) {
    this.logger.log('LiqPay callback body:', JSON.stringify(body));
    if (!body.data || !body.signature) {
      throw new BadRequestException('Missing data or signature');
    }

    try {
      return await this.paymentService.handleCallback(
        body.data,
        body.signature,
      );
    } catch (err) {
      this.logger.error('Callback error:', err.message);
      throw new BadRequestException(err.message);
    }
  }
}
