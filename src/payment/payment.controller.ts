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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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

  /**
   * Create a payment for an authenticated user.
   * Requires JWT authentication. The payment will be created for the current user and their cart.
   * @param req Request with user info
   * @param dto Payment creation data
   */
  @UseGuards(JwtAuthGuard)
  @Post('create')
  @ApiBearerAuth('JWT-auth')
  @ApiTags('Payment')
  @ApiOperation({
    summary: 'Create payment for authenticated user',
    description:
      'Creates a payment for the authenticated user using their cart. Requires JWT token.',
  })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or missing data' })
  async createPayment(
    @Req() req: RequestWithUser,
    @Body() dto: CreatePaymentUserDto,
  ) {
    // Creates a payment for the authenticated user
    const userId = req.user?.id;
    return this.paymentService.create(userId, dto);
  }

  /**
   * Create a payment for a guest (not authenticated).
   * The payment will be created for the guest cart using guestId and email.
   * @param dto Payment creation data for guest
   */
  @Post('create-guest')
  @ApiOperation({
    summary: 'Create payment for guest',
    description:
      'Creates a payment for a guest user using guest cart and email. No authentication required.',
  })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or missing data' })
  async createGuestPayment(@Body() dto: CreatePaymentGuestDto) {
    // Creates a payment for a guest user
    return this.paymentService.create(undefined, dto);
  }

  /**
   * Handle LiqPay payment callback (POST).
   * This endpoint is called by the payment provider after payment is processed.
   * It verifies the data and signature, and updates the payment/order status.
   * @param req Raw request from LiqPay
   */
  @Post('callback')
  @ApiOperation({
    summary: 'Handle LiqPay payment callback',
    description:
      'Handles callback from LiqPay after payment. Verifies data and signature, updates payment/order status.',
  })
  @ApiResponse({ status: 200, description: 'Callback processed successfully' })
  @ApiResponse({
    status: 400,
    description: 'Missing or invalid data/signature',
  })
  async handleCallback(@Req() req: Request) {
    // Handles LiqPay callback
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

  /**
   * Get payment callback result (GET).
   * This endpoint can be used to check if the payment result was received.
   */
  @Get('callback')
  @ApiOperation({
    summary: 'Get payment callback result',
    description:
      'Returns a simple message indicating the payment result was received.',
  })
  @ApiResponse({ status: 200, description: 'Payment result received' })
  async getCallbackResult() {
    // Returns a simple message for payment callback result
    return 'Payment result received';
  }
}
