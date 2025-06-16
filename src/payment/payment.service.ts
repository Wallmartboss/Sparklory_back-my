import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
  private publicKey = process.env.LIQPAY_PUBLIC_KEY;
  private privateKey = process.env.LIQPAY_PRIVATE_KEY;

  generateFormData(amount: number, orderId: string, description: string) {
    const data = {
      version: 3,
      public_key: this.publicKey,
      action: 'pay',
      amount,
      currency: 'UAH',
      description,
      order_id: orderId,
      server_url: 'https://your-backend.com/payment/callback',
      result_url: 'https://your-frontend.com/success',
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
}