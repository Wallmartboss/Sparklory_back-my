import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as crypto from 'crypto';
import { Model, Types } from 'mongoose';
import { CartService } from '../cart/cart.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Payment } from './payment.schema';

/**
 * Service for handling payment logic and LiqPay integration.
 */
@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly publicKey: string;
  private readonly privateKey: string;
  private readonly resultUrl: string;
  private readonly serverUrl: string;
  private readonly isDevelopment: boolean;

  /**
   * Description for LiqPay payment.
   */
  private static readonly ORDER_PAYMENT_DESCRIPTION = 'Order payment';

  constructor(
    private configService: ConfigService,
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    private readonly cartService: CartService,
  ) {
    this.publicKey = this.configService.get('LIQPAY_PUBLIC_KEY');
    this.privateKey = this.configService.get('LIQPAY_PRIVATE_KEY');
    this.resultUrl = this.configService.get('PAYMENT_RESULT_URL');
    this.serverUrl = this.configService.get('PAYMENT_SERVER_URL');
    this.isDevelopment = this.configService.get('NODE_ENV') === 'development';
    if (!this.publicKey || !this.privateKey) {
      throw new Error('LiqPay credentials are not configured');
    }
  }

  /**
   * Generates unique order ID in LiqPay format
   * @returns string Order ID
   */
  private generateOrderId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7).toUpperCase();
    return `${random}${timestamp}`;
  }

  /**
   * Generates LiqPay form data and signature.
   * @param amount Payment amount
   * @param orderId Unique order identifier
   * @param description Payment description
   * @returns LiqPay form data and signature
   */
  generateFormData(
    amount: number,
    orderId: string,
    description: string,
  ): LiqPayFormData {
    this.logger.log('Generating LiqPay form data with URLs:', {
      serverUrl: this.serverUrl,
      resultUrl: this.resultUrl,
    });

    if (!this.serverUrl || !this.resultUrl) {
      throw new Error('Payment URLs are not configured');
    }

    const payload = {
      public_key: this.publicKey,
      version: '3',
      action: 'pay',
      amount,
      currency: 'UAH',
      description,
      order_id: orderId,
      result_url: this.resultUrl,
      server_url: this.serverUrl,
    };

    this.logger.log('LiqPay payload:', payload);

    const data = Buffer.from(JSON.stringify(payload)).toString('base64');

    // Проверяем, что данные корректно кодируются и декодируются
    const decodedData = JSON.parse(Buffer.from(data, 'base64').toString());
    this.logger.log('Decoded data (verification):', decodedData);

    const signature = crypto
      .createHash('sha1')
      .update(this.privateKey + data + this.privateKey)
      .digest('base64');

    return { data, signature };
  }

  /**
   * Creates a new payment and generates LiqPay form data.
   * @param userId User identifier
   * @param dto Payment creation DTO
   * @returns LiqPay form data, payment id, and order id
   */
  async create(
    userId: string,
    dto: CreatePaymentDto,
  ): Promise<LiqPayCreateResponse> {
    this.logger.log('Creating payment with server_url:', this.serverUrl);

    const cart = await this.cartService.getOrCreateCart(userId);
    const orderId = this.generateOrderId();

    // Обновляем cart, добавляя order_id
    await this.cartService.updateOrderId(cart._id.toString(), orderId);

    const payment = await this.paymentModel.create({
      user: new Types.ObjectId(userId),
      cart: cart._id,
      amount: dto.amount,
      paymentMethod: 'card',
      status: 'pending',
      order_id: orderId,
    });

    this.logger.log('Payment created in database:', payment);

    const formData = this.generateFormData(
      dto.amount,
      orderId,
      PaymentService.ORDER_PAYMENT_DESCRIPTION,
    );

    return {
      ...formData,
      paymentId: payment._id.toString(),
      order_id: orderId,
    };
  }

  /**
   * Verifies LiqPay callback signature.
   * @param data Base64-encoded data
   * @param signature Signature to verify
   * @returns True if signature is valid
   */
  verifyCallback(data: string, signature: string): boolean {
    if (this.isDevelopment) return true;
    const expected = crypto
      .createHash('sha1')
      .update(this.privateKey + data + this.privateKey)
      .digest('base64');
    return expected === signature;
  }

  /**
   * Handles LiqPay callback and updates payment status.
   * @param data Base64-encoded data
   * @param signature Signature from LiqPay
   * @returns Callback result
   */
  async handleCallback(
    data: string,
    signature: string,
  ): Promise<LiqPayCallbackResponse> {
    if (!this.verifyCallback(data, signature)) {
      throw new Error('Invalid signature');
    }

    const decoded = JSON.parse(Buffer.from(data, 'base64').toString());
    const { order_id, status, transaction_id } = decoded;

    this.logger.log('Looking for payment with order_id:', order_id);

    // Поиск всех платежей для отладки
    const allPayments = await this.paymentModel.find({}).lean();
    this.logger.log('All payments in database:', allPayments);

    const payment = await this.paymentModel.findOne({ order_id });

    if (!payment) {
      this.logger.error('Payment not found. Search criteria:', { order_id });
      // Возвращаем успех, чтобы LiqPay не повторял запрос
      return { status: 'success', orderId: order_id };
    }

    if (payment.status === 'completed') {
      // Уже обработан — возвращаем успех
      return { status: 'success', orderId: order_id };
    }

    this.logger.log('Found payment:', payment);

    payment.status = status === 'success' ? 'completed' : 'failed';
    payment.transactionId = transaction_id;
    await payment.save();

    // Если оплата успешна, отмечаем корзину как заказанную
    if (status === 'success') {
      await this.cartService.setOrderedByOrderId(order_id);
    }

    return { status: 'success', orderId: order_id };
  }
}

/**
 * LiqPay form data and signature.
 */
export interface LiqPayFormData {
  data: string;
  signature: string;
}

/**
 * Response for payment creation (LiqPay form data + ids).
 */
export interface LiqPayCreateResponse extends LiqPayFormData {
  paymentId: string;
  order_id: string;
}

/**
 * Response for LiqPay callback.
 */
export interface LiqPayCallbackResponse {
  status: string;
  orderId: string;
}
