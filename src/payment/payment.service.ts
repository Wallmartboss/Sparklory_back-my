import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as crypto from 'crypto';
import { Model, Types } from 'mongoose';
import { CartService } from '../cart/cart.service';
import { EmailService } from '../email/email.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { UserService } from '../user/user.service';
import {
  CreatePaymentGuestDto,
  CreatePaymentUserDto,
} from './dto/create-payment.dto';
import { Payment } from './payment.schema';

/**
 * Сервіс для обробки логіки платежів та інтеграції з LiqPay.
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
   * Опис для платежу LiqPay.
   */
  private static readonly ORDER_PAYMENT_DESCRIPTION = 'Order payment';

  constructor(
    private configService: ConfigService,
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    private readonly cartService: CartService,
    private readonly emailService: EmailService,
    private readonly userService: UserService,
    private readonly loyaltyService: LoyaltyService,
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
   * Генерує унікальний ідентифікатор замовлення у форматі LiqPay
   * @returns string Ідентифікатор замовлення
   */
  private generateOrderId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7).toUpperCase();
    return `${random}${timestamp}`;
  }

  /**
   * Генерує дані форми LiqPay та підпис.
   * @param amount Сума платежу
   * @param orderId Унікальний ідентифікатор замовлення
   * @param description Опис платежу
   * @returns Дані форми LiqPay та підпис
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

    // this.logger.log('LiqPay payload:', payload);

    const data = Buffer.from(JSON.stringify(payload)).toString('base64');

    // Перевіряємо, що дані коректно кодуються та декодуються
    const decodedData = JSON.parse(Buffer.from(data, 'base64').toString());
    this.logger.log('Decoded data (verification):', decodedData);

    const signature = crypto
      .createHash('sha1')
      .update(this.privateKey + data + this.privateKey)
      .digest('base64');

    return { data, signature };
  }

  /**
   * Створює новий платіж та генерує дані форми LiqPay.
   * @param userId Ідентифікатор користувача
   * @param dto DTO для створення платежу
   * @returns Дані форми LiqPay, ідентифікатор платежу та замовлення
   */
  async create(
    userId: string | undefined,
    dto: CreatePaymentUserDto | CreatePaymentGuestDto,
  ): Promise<LiqPayCreateResponse> {
    this.logger.log('Creating payment with server_url:', this.serverUrl);

    let cart;
    if (userId) {
      cart = await this.cartService.getOrCreateCart(userId, undefined);
    } else if ('guestId' in dto && dto.guestId) {
      cart = await this.cartService.getOrCreateCart(undefined, dto.guestId);
      await this.cartService.recalculateTotals(cart);
      await cart.save();
    } else {
      throw new Error('UserId or guestId must be provided');
    }
    const orderId = this.generateOrderId();

    await this.cartService.updateOrderId(cart._id.toString(), orderId);

    const paymentData: any = {
      cart: cart._id,
      amount: dto.amount,
      paymentMethod: 'card',
      status: 'pending',
      order_id: orderId,
    };
    if (userId) {
      paymentData.user = new Types.ObjectId(userId);
    }
    if ('guestId' in dto && dto.guestId) {
      paymentData.guestId = dto.guestId;
    }
    if ('contactInfo' in dto && dto.contactInfo) {
      paymentData.contactInfo = dto.contactInfo;
    }

    const payment = await this.paymentModel.create(paymentData);

    if ('contactInfo' in dto && dto.contactInfo?.email) {
      await this.emailService.sendPaymentCreated(
        dto.contactInfo.email,
        payment,
      );
    }
    if (userId) {
      const user = await this.userService.findOne(userId);
      if (user?.email) {
        await this.emailService.sendPaymentCreated(user.email, payment);
      }
    }

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
   * Перевіряє підпис зворотного виклику LiqPay.
   * @param data Данні у форматі Base64
   * @param signature Підпис для перевірки
   * @returns true, якщо підпис коректний
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
   * Обробляє зворотний виклик LiqPay та оновлює статус платежу.
   * @param data Данні у форматі Base64
   * @param signature Підпис з LiqPay
   * @returns Результат зворотного виклику
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

    // this.logger.log('Looking for payment with order_id:', order_id);

    const payment = await this.paymentModel.findOne({ order_id });

    if (!payment) {
      this.logger.error('Payment not found. Search criteria:', { order_id });
      // Возвращаем успех, чтобы LiqPay не повторял запрос
      return { status: 'success', orderId: order_id };
    }

    if (payment.status === 'completed') {
      // Вже оброблено — повертаємо успіх
      return { status: 'success', orderId: order_id };
    }

    // this.logger.log('Found payment:', payment);

    payment.status = status === 'success' ? 'completed' : 'failed';
    payment.transactionId = transaction_id;
    await payment.save();

    // Email повідомлення про результат платежу
    if (payment.contactInfo?.email) {
      await this.emailService.sendPaymentResult(
        payment.contactInfo.email,
        payment,
        payment.status === 'completed',
      );
    }
    if (payment.user) {
      const user = await this.userService.findOne(payment.user.toString());
      if (user?.email) {
        await this.emailService.sendPaymentResult(
          user.email,
          payment,
          payment.status === 'completed',
        );
      }
    }

    // Якщо оплата успішна, позначаємо корзину як замовлену
    if (status === 'success') {
      await this.cartService.setOrderedByOrderId(order_id);
      // Додаємо заказ до історії покупок користувача
      if (payment.user) {
        const cart = await this.cartService.getCartByOrderId(order_id);
        this.logger.log(`[Лояльність] Корзина: ${JSON.stringify(cart)}`);
        this.logger.log(
          `[Лояльність] Товары в корзине: ${JSON.stringify(cart?.items)}`,
        );
        if (cart && cart.items && cart.items.length > 0) {
          this.logger.log(
            `[Лояльність] В корзине ${cart.items.length} товаров`,
          );
          const totalAmount = cart.items.reduce(
            (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
            0,
          );
          await this.loyaltyService.addOrderToHistory(
            payment.user.toString(),
            order_id,
            cart.items,
            totalAmount,
            new Date(),
            `Заказ из ${cart.items.length} товаров`,
          );
        } else {
          this.logger.warn(`[Лояльність] В корзине нет товаров!`);
        }
      } else {
        this.logger.warn(
          `[Лояльність] Не вказано payment.user для order_id ${order_id}`,
        );
      }
    }

    return { status: 'success', orderId: order_id };
  }
}

/**
 * Дані форми LiqPay та підпис.
 */
export interface LiqPayFormData {
  data: string;
  signature: string;
}

/**
 * Відповідь на створення платежу (дані форми LiqPay + ідентифікатори).
 */
export interface LiqPayCreateResponse extends LiqPayFormData {
  paymentId: string;
  order_id: string;
}

/**
 * Відповідь на зворотний виклик LiqPay.
 */
export interface LiqPayCallbackResponse {
  status: string;
  orderId: string;
}
