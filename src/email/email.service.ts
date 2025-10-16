import { ECondition } from '@/common';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    this.useSendGrid = Boolean(apiKey);
    this.logger.log(
      `EmailService: using ${this.useSendGrid ? 'SendGrid HTTP' : 'Gmail SMTP'} transport`,
    );
  }
  private logger = new Logger('EmailService');
  private useSendGrid: boolean = false;

  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: this.configService.get<string>('GOOGLE_EMAIL'),
      pass: this.configService.get<string>('GOOGLE_PASSWORD'),
    },
  });

  private async sendMail(options: {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }): Promise<void> {
    const fromEmail =
      options.from ||
      this.configService.get<string>('SENDGRID_FROM_EMAIL') ||
      (process.env.GOOGLE_EMAIL as string);

    if (this.useSendGrid) {
      // Extract email from "Name <email>" format for SendGrid
      const cleanFromEmail = fromEmail.includes('<')
        ? fromEmail.match(/<(.+)>/)?.[1] || fromEmail
        : fromEmail;

      this.logger.log(
        `SendGrid: sending from ${cleanFromEmail} to ${options.to}`,
      );

      await new Promise<void>((resolve, reject) => {
        const payload = JSON.stringify({
          personalizations: [
            {
              to: [{ email: options.to }],
              subject: options.subject,
            },
          ],
          from: { email: cleanFromEmail },
          content: [{ type: 'text/html', value: options.html }],
        });

        const req = https.request(
          {
            hostname: 'api.sendgrid.com',
            path: '/v3/mail/send',
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.configService.get<string>('SENDGRID_API_KEY')}`,
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payload),
            },
          },
          res => {
            if (
              res.statusCode &&
              res.statusCode >= 200 &&
              res.statusCode < 300
            ) {
              resolve();
            } else {
              const chunks: Buffer[] = [];
              res.on('data', d => chunks.push(d as Buffer));
              res.on('end', () => {
                const body = Buffer.concat(chunks).toString('utf8');
                reject(
                  new Error(
                    `SendGrid HTTP error ${res.statusCode}: ${body || 'no body'}`,
                  ),
                );
              });
            }
          },
        );
        req.on('error', reject);
        req.write(payload);
        req.end();
      });
      return;
    }

    await this.transporter.sendMail({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  }

  async sendEmail(email: string, token: string, condition: ECondition) {
    let subject: string;
    let html: string;
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );

    switch (condition) {
      case ECondition.ResetPassword:
        subject = 'Password Reset Request';
        const resetLink = `${frontendUrl}/reset-password?email=${encodeURIComponent(email)}&code=${token}`;
        html = `
          <p>Hello,</p>
          <p>We received a request to reset your password. Please use the following confirmation code to proceed:</p>
          <p style="text-align: center; font-weight: bold; font-size: 30px;">${token}</p>
          <p>Or click the link below to reset your password:</p>
          <p style="text-align: center; font-weight: bold; font-size: 18px;"><a href="${resetLink}">${resetLink}</a></p>
          <p>If you did not request a password reset, please ignore this email.</p>
          <p>Thank you!</p>
        `;
        break;

      case ECondition.EmailVerify:
        subject = 'Email Verification';
        const verifyLink = `${frontendUrl}/verify-email?email=${encodeURIComponent(email)}&code=${token}`;
        html = `
          <p>Hello,</p>
          <p>Please confirm your email address by clicking the link below:</p>
          <p style="text-align: center; font-weight: bold; font-size: 18px;"><a href="${verifyLink}">${verifyLink}</a></p>
          <p>If you did not register, please ignore this email.</p>
          <p>Thank you!</p>
        `;
        break;

      case ECondition.VerifyDevice:
        subject = 'New Device Login Attempt';
        html = `
          <p>Hello,</p>
          <p>We noticed a login attempt from a new device. Please use the following confirmation code to verify it's you:</p>
          <p style="text-align: center; font-weight: bold; font-size: 30px;">${token}</p>
          <p>If you did not attempt to log in, please ignore this email.</p>
          <p>Thank you!</p>
        `;
        break;

      default:
        throw new Error('Unknown email condition');
    }

    try {
      await this.sendMail({ to: email, subject, html });
      this.logger.log(`${subject} email sent to ${email}`);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async sendResetPassword(email: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const subject = 'Password Reset Request';
    const resetLink = `${frontendUrl}/reset-password?email=${encodeURIComponent(
      email,
    )}&code=${token}`;
    const html = `
          <p>Hello,</p>
          <p>We received a request to reset your password. Please use the following confirmation code to proceed:</p>
          <p style="text-align: center; font-weight: bold; font-size: 30px;">${token}</p>
          <p>Or click the link below to reset your password:</p>
          <p style="text-align: center; font-weight: bold; font-size: 18px;"><a href="${resetLink}">${resetLink}</a></p>
          <p>If you did not request a password reset, please ignore this email.</p>
          <p>Thank you!</p>
        `;
    await this.sendMail({
      from: `Your Sparklory <${process.env.GOOGLE_EMAIL}>`,
      to: email,
      subject,
      html,
    });
    this.logger.log(`${subject} email sent to ${email}`);
  }

  async sendCartReminder(email: string, cart: any): Promise<void> {
    const subject = 'Reminder: Your cart is waiting!';
    const html = `
      <p>Hello!</p>
      <p>You have items in your cart:</p>
      <ul>
        ${(cart.items || []).map((item: any) => `<li>${item.product} x${item.quantity}</li>`).join('')}
      </ul>
      <p>Complete your purchase before your favorites are gone!</p>
      <br/>
      <p>Best regards,<br/>Your Sparklory</p>
    `;
    await this.sendMail({
      from: `Your Sparklory <${process.env.GOOGLE_EMAIL}>`,
      to: email,
      subject,
      html,
    });
    this.logger.log(`Cart reminder sent to ${email}`);
  }

  async sendPaymentCreated(email: string, payment: any): Promise<void> {
    const subject = 'Your payment has been created';
    const html = `
      <p>Hello!</p>
      <p>Your payment for order <b>${payment.order_id}</b> has been created.</p>
      <p>Amount: <b>${payment.amount}</b></p>
      <p>Status: <b>${payment.status}</b></p>
      <br/>
      <p>Best regards,<br/>Your Sparklory</p>
    `;
    await this.sendMail({
      from: `Your Sparklory <${process.env.GOOGLE_EMAIL}>`,
      to: email,
      subject,
      html,
    });
    this.logger.log(`Payment created email sent to ${email}`);
  }

  async sendPaymentResult(
    email: string,
    payment: any,
    success: boolean,
  ): Promise<void> {
    const subject = success ? 'Payment successful' : 'Payment failed';
    const html = `
      <p>Hello!</p>
      <p>Your payment for order <b>${payment.order_id}</b> was <b>${success ? 'successful' : 'unsuccessful'}</b>.</p>
      <p>Amount: <b>${payment.amount}</b></p>
      <p>Status: <b>${payment.status}</b></p>
      <br/>
      <p>Best regards,<br/>Your Sparklory</p>
    `;
    await this.sendMail({
      from: `Your Sparklory <${process.env.GOOGLE_EMAIL}>`,
      to: email,
      subject,
      html,
    });
    this.logger.log(`Payment result email sent to ${email}`);
  }

  async sendProductInStock(email: string, product: any): Promise<void> {
    const subject = 'Product is back in stock!';
    const html = `
      <p>Hello!</p>
      <p>The product <b>${product.name}</b> is now available in our store.</p>
      <p><a href="${this.configService.get('FRONTEND_URL', 'http://localhost:3000')}/product/${product._id}">View product</a></p>
      <br/>
      <p>Best regards,<br/>Your Sparklory</p>
    `;
    await this.transporter.sendMail({
      from: `Your Sparklory <${process.env.GOOGLE_EMAIL}>`,
      to: email,
      subject,
      html,
    });
    this.logger.log(`Product in stock notification sent to ${email}`);
  }

  async sendSubscriptionCreated(email: string, product: any): Promise<void> {
    const subject = 'Subscription created: product back in stock';
    const html = `
      <p>Hello!</p>
      <p>You have successfully subscribed to notifications for the product <b>${product.name}</b>.</p>
      <p>We will notify you as soon as it is back in stock.</p>
      <p><a href="${this.configService.get('FRONTEND_URL', 'http://localhost:3000')}/product/${product._id}">View product</a></p>
      <br/>
      <p>Best regards,<br/>Your Sparklory</p>
    `;
    await this.transporter.sendMail({
      from: `Your Sparklory <${process.env.GOOGLE_EMAIL}>`,
      to: email,
      subject,
      html,
    });
    this.logger.log(`Subscription created email sent to ${email}`);
  }
}
