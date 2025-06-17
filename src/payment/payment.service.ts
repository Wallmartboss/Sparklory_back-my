import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as crypto from 'crypto';
import { Model, Types } from 'mongoose';
import { CartService } from '../cart/cart.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Payment } from './payment.schema';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly publicKey: string;
  private readonly privateKey: string;
  private readonly serverUrl: string;
  private readonly resultUrl: string;
  private readonly isDevelopment: boolean;

  constructor(
    private configService: ConfigService,
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    private readonly cartService: CartService,
  ) {
    this.publicKey = this.configService.get<string>('LIQPAY_PUBLIC_KEY');
    this.privateKey = this.configService.get<string>('LIQPAY_PRIVATE_KEY');
    this.serverUrl = this.configService.get<string>('PAYMENT_SERVER_URL');
    this.resultUrl = this.configService.get<string>('PAYMENT_RESULT_URL');
    this.isDevelopment =
      this.configService.get<string>('NODE_ENV') === 'development';
    this.logger.log(
      `Payment service initialized in ${this.isDevelopment ? 'development' : 'production'} mode`,
    );

    this.logger.log('Payment service initialized with:');
    this.logger.log(`Public Key: ${this.publicKey ? '✓' : '✗'}`);
    this.logger.log(`Private Key: ${this.privateKey ? '✓' : '✗'}`);
    this.logger.log(`Server URL: ${this.serverUrl ? '✓' : '✗'}`);
    this.logger.log(`Result URL: ${this.resultUrl ? '✓' : '✗'}`);

    if (!this.publicKey || !this.privateKey) {
      throw new Error('LiqPay credentials are not configured');
    }
  }

  generateFormData(amount: number, orderId: string, description: string) {
    if (!amount || amount <= 0) {
      throw new BadRequestException('Invalid amount');
    }

    const data = {
      version: 3,
      public_key: this.publicKey,
      action: 'pay',
      amount,
      currency: 'UAH',
      description,
      order_id: orderId,
      server_url: this.serverUrl,
      result_url: this.resultUrl,
    };

    const jsonData = Buffer.from(JSON.stringify(data)).toString('base64');
    const signature = crypto
      .createHash('sha1')
      .update(this.privateKey + jsonData + this.privateKey)
      .digest('base64');

    return {
      data: jsonData,
      signature,
    };
  }

  verifyCallback(data: string, signature: string): boolean {
    if (this.isDevelopment) {
      this.logger.log('Development mode: skipping signature verification');
      return true;
    }
    const calculatedSignature = crypto
      .createHash('sha1')
      .update(this.privateKey + data + this.privateKey)
      .digest('base64');
    return calculatedSignature === signature;
  }

  async create(userId: string, createPaymentDto: CreatePaymentDto) {
    const cart = await this.cartService.getOrCreateCart(userId);

    const payment = new this.paymentModel({
      user: new Types.ObjectId(userId),
      cart: cart._id,
      amount: createPaymentDto.amount,
      paymentMethod: 'card',
      status: 'pending',
    });

    await payment.save();

    // Generate LiqPay data
    const orderId = `order_${Date.now()}`;
    const data = {
      public_key: this.publicKey,
      version: '3',
      action: 'pay',
      amount: createPaymentDto.amount,
      currency: 'UAH',
      description: 'Payment for products in cart',
      order_id: orderId,
      result_url: `${this.configService.get('API_URL')}/payment/result`,
      server_url: `${this.configService.get('API_URL')}/payment/callback`,
    };

    // Create base64 encoded data
    const dataBase64 = Buffer.from(JSON.stringify(data)).toString('base64');

    // Create signature
    const signature = crypto
      .createHash('sha1')
      .update(this.privateKey + dataBase64 + this.privateKey)
      .digest('base64');

    return {
      data: dataBase64,
      signature,
      paymentId: payment._id,
    };
  }

  async handleCallback(data: string, signature: string) {
    if (!this.verifyCallback(data, signature)) {
      throw new Error('Invalid signature');
    }

    const decodedData = JSON.parse(Buffer.from(data, 'base64').toString());
    const { order_id, status, transaction_id } = decodedData;

    // Update payment status
    const payment = await this.paymentModel.findOne({ order_id });
    if (payment) {
      payment.status = status === 'success' ? 'completed' : 'failed';
      payment.transactionId = transaction_id;
      await payment.save();
    }

    return { status: 'success', orderId: order_id };
  }
}
