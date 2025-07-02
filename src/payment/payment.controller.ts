import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { User } from '@/user/schema/user.schema';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import {
  CreatePaymentGuestDto,
  CreatePaymentUserDto,
} from './dto/create-payment.dto';
import { PaymentService } from './payment.service';

interface RequestWithUser extends Request {
  user?: User;
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
    @Body() dto: CreatePaymentUserDto,
  ) {
    const userId = req.user?.id;
    return this.paymentService.create(userId, dto);
  }

  @Post('create-guest')
  async createGuestPayment(@Body() dto: CreatePaymentGuestDto) {
    return this.paymentService.create(undefined, dto);
  }

  @Post('callback')
  async handleCallback(@Req() req: Request) {
    this.logger.log('LiqPay callback raw body:', JSON.stringify(req.body));
    const data =
      req.body.data ||
      (typeof req.body === 'string' && req.body.match(/data=([^&]*)/)?.[1]);
    const signature =
      req.body.signature ||
      (typeof req.body === 'string' &&
        req.body.match(/signature=([^&]*)/)?.[1]);
    if (!data || !signature) {
      throw new BadRequestException('Missing data or signature');
    }
    try {
      return await this.paymentService.handleCallback(data, signature);
    } catch (err) {
      this.logger.error('Callback error:', err.message);
      throw new BadRequestException(err.message);
    }
  }

  @Get('callback')
  async getCallbackResult() {
    return 'Payment result received';
  }
}
