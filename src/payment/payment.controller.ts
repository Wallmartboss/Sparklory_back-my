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
import { Request } from 'express';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentService } from './payment.service';

interface RequestWithUser extends Request {
  user: User;
}

interface PaymentCallbackDto {
  data: string;
  signature: string;
}

@Controller('payment')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Post('create')
  async createPayment(
    @Req() req: RequestWithUser,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    this.logger.log(`Creating payment for user ${req.user.id}`);
    return this.paymentService.create(req.user.id, createPaymentDto);
  }

  @Post('callback')
  async handleCallback(@Body() body: PaymentCallbackDto) {
    if (!body.data || !body.signature) {
      throw new BadRequestException('Invalid callback data');
    }

    try {
      return await this.paymentService.handleCallback(
        body.data,
        body.signature,
      );
    } catch (error) {
      this.logger.error(`Error processing callback: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }
}
