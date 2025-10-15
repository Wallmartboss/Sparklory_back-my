import { ECondition } from '@/common';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as axios from 'axios';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private logger = new Logger('EmailService');
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const email = this.configService.get<string>('GOOGLE_EMAIL');
    const password = this.configService.get<string>('GOOGLE_PASSWORD');
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    if (!email || !password) {
      this.logger.error(
        'GOOGLE_EMAIL or GOOGLE_PASSWORD environment variables are not set',
      );
      throw new Error('Email configuration is missing');
    }

    // Different configuration for production (Render.com) vs development
    const transporterConfig = isProduction
      ? {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: email,
            pass: password,
          },
          tls: {
            rejectUnauthorized: false,
            ciphers: 'SSLv3',
          },
          connectionTimeout: 120000, // 2 minutes for cloud
          greetingTimeout: 60000, // 1 minute for cloud
          socketTimeout: 120000, // 2 minutes for cloud
        }
      : {
          service: 'gmail',
          auth: {
            user: email,
            pass: password,
          },
          connectionTimeout: 60000,
          greetingTimeout: 30000,
          socketTimeout: 60000,
        };

    this.transporter = nodemailer.createTransport(transporterConfig);
    this.logger.log(
      `Email service initialized for ${isProduction ? 'production' : 'development'} environment`,
    );

    // Verify connection configuration on startup
    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    try {
      this.logger.log('Verifying email service connection...');
      await this.transporter.verify();
      this.logger.log('Email service connection verified successfully');
    } catch (error) {
      this.logger.error('Email service connection verification failed:', error);
      this.logger.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response,
      });

      // Try alternative configuration with port 465 (SSL)
      this.logger.log('Attempting fallback to port 465 (SSL)...');
      await this.tryFallbackConnection();
    }
  }

  private async tryFallbackConnection(): Promise<void> {
    const email = this.configService.get<string>('GOOGLE_EMAIL');
    const password = this.configService.get<string>('GOOGLE_PASSWORD');

    const fallbackConfig = {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: email,
        pass: password,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 120000,
      greetingTimeout: 60000,
      socketTimeout: 120000,
    };

    try {
      this.transporter = nodemailer.createTransport(fallbackConfig);
      await this.transporter.verify();
      this.logger.log('Fallback connection (port 465) verified successfully');
    } catch (fallbackError) {
      this.logger.error('Fallback connection also failed:', fallbackError);
    }
  }

  private async sendEmailWithFallback(
    email: string,
    subject: string,
    html: string,
    from: string = `Your Sparklory <${process.env.GOOGLE_EMAIL}>`,
  ): Promise<void> {
    const mailOptions = {
      from,
      to: email,
      subject,
      html,
    };

    try {
      this.logger.log(`Attempting to send ${subject} email to ${email}...`);
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`${subject} email sent to ${email}: ` + info.response);
    } catch (error) {
      this.logger.error(`Failed to send ${subject} email to ${email}:`, error);
      this.logger.error('Email error details:', {
        message: error.message,
        code: error.code,
        response: error.response,
        command: error.command,
      });

      // Try HTTP API as fallback for connection timeout errors
      if (
        error.code === 'ETIMEDOUT' ||
        error.message.includes('Connection timeout')
      ) {
        this.logger.log(
          `Attempting HTTP API fallback for ${subject} email to ${email}...`,
        );
        try {
          await this.sendEmailViaHTTP(email, subject, html);
          this.logger.log(`${subject} email sent via HTTP API to ${email}`);
          return;
        } catch (httpError) {
          this.logger.error(
            `HTTP API fallback also failed for ${email}:`,
            httpError.message,
          );
          throw new Error(
            `Both SMTP and HTTP API email sending failed: ${error.message}`,
          );
        }
      }

      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  private async sendEmailViaHTTP(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    const email = this.configService.get<string>('GOOGLE_EMAIL');
    const password = this.configService.get<string>('GOOGLE_PASSWORD');

    // Create base64 encoded auth string
    const auth = Buffer.from(`${email}:${password}`).toString('base64');

    // Create email message in RFC 2822 format
    const message = [
      `To: ${to}`,
      `From: Your Sparklory <${email}>`,
      `Subject: ${subject}`,
      `Content-Type: text/html; charset=UTF-8`,
      ``,
      html,
    ].join('\r\n');

    // Encode message in base64url format
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    try {
      this.logger.log(`Attempting to send email via Gmail API to ${to}...`);

      const response = await axios.default.post(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        {
          raw: encodedMessage,
        },
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      this.logger.log(`Email sent via Gmail API to ${to}: ${response.status}`);
    } catch (error) {
      this.logger.error(
        `Gmail API email sending failed to ${to}:`,
        error.response?.data || error.message,
      );
      throw new Error(`Gmail API email sending failed: ${error.message}`);
    }
  }

  async sendEmail(
    email: string,
    token: string,
    condition: ECondition,
  ): Promise<void> {
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

    await this.sendEmailWithFallback(
      email,
      subject,
      html,
      process.env.GOOGLE_EMAIL,
    );
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

    await this.sendEmailWithFallback(email, subject, html);
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

    await this.sendEmailWithFallback(email, subject, html);
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

    await this.sendEmailWithFallback(email, subject, html);
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

    await this.sendEmailWithFallback(email, subject, html);
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

    await this.sendEmailWithFallback(email, subject, html);
  }
}
