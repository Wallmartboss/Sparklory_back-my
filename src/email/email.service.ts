import { ECondition } from '@/common';
import {
  AccountApi,
  SendSmtpEmail,
  TransactionalEmailsApi,
} from '@getbrevo/brevo';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private logger = new Logger('EmailService');
  private transporter: nodemailer.Transporter;
  private brevoApiInstance: TransactionalEmailsApi;

  constructor(private configService: ConfigService) {
    const email = this.configService.get<string>('GOOGLE_EMAIL');
    const password = this.configService.get<string>('GOOGLE_PASSWORD');
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    this.logger.log(`NODE_ENV: ${this.configService.get<string>('NODE_ENV')}`);
    this.logger.log(`Is Production: ${isProduction}`);

    // Check for Brevo configuration (API or SMTP)
    const brevoApiKey = this.configService.get<string>('BREVO_API_KEY');
    const brevoSmtpLogin = this.configService.get<string>('BREVO_SMTP_LOGIN');
    const brevoSmtpPassword = this.configService.get<string>(
      'BREVO_SMTP_PASSWORD',
    );

    this.logger.log(`Brevo API Key present: ${!!brevoApiKey}`);
    this.logger.log(`Brevo SMTP Login present: ${!!brevoSmtpLogin}`);

    if (isProduction && brevoApiKey) {
      // Initialize Brevo API for production
      this.brevoApiInstance = new TransactionalEmailsApi();
      this.brevoApiInstance.setApiKey(0, brevoApiKey); // 0 = apiKey

      this.logger.log(
        'Email service initialized with Brevo API for production',
      );
      this.verifyBrevoConnection();
      return;
    }

    if (isProduction && brevoSmtpLogin && brevoSmtpPassword) {
      // Initialize Brevo SMTP for production
      const transporterConfig = {
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: {
          user: brevoSmtpLogin,
          pass: brevoSmtpPassword,
        },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 30000,
        greetingTimeout: 15000,
        socketTimeout: 30000,
      };

      this.transporter = nodemailer.createTransport(transporterConfig);
      this.logger.log(
        'Email service initialized with Brevo SMTP for production',
      );
      this.verifyConnection();
      return;
    }

    // Fallback to Gmail for development or when Brevo is not configured
    if (!email || !password) {
      this.logger.error(
        'GOOGLE_EMAIL or GOOGLE_PASSWORD environment variables are not set',
      );
      throw new Error('Email configuration is missing');
    }

    const transporterConfig = {
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
    this.logger.log('Using Gmail for email sending');

    // Verify connection configuration on startup
    this.verifyConnection();
  }

  private async verifyBrevoConnection(): Promise<void> {
    try {
      this.logger.log('Verifying Brevo API connection...');
      // Test Brevo API connection by getting account info
      const accountApi = new AccountApi();
      // Get the API key from the email API instance
      const apiKey = this.configService.get<string>('BREVO_API_KEY');
      accountApi.setApiKey(0, apiKey);
      const accountInfo = await accountApi.getAccount();
      this.logger.log('Brevo API connection verified successfully');
      this.logger.log(`Account email: ${accountInfo.body.email}`);
    } catch (error) {
      this.logger.error('Brevo API connection verification failed:', error);
      this.logger.error('Error details:', {
        message: error.message,
        status: error.status,
        response: error.response?.text,
      });
    }
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

    // Try Gmail with different settings as fallback
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
      connectionTimeout: 30000,
      greetingTimeout: 15000,
      socketTimeout: 30000,
    };

    try {
      this.transporter = nodemailer.createTransport(fallbackConfig);
      await this.transporter.verify();
      this.logger.log('Fallback connection (Gmail SSL) verified successfully');
    } catch (fallbackError) {
      this.logger.error('Fallback connection also failed:', fallbackError);
    }
  }

  private async sendEmailWithFallback(
    email: string,
    subject: string,
    html: string,
    from: string = `Your Sparklory <${this.configService.get<string>('BREVO_FROM_EMAIL') || process.env.GOOGLE_EMAIL}>`,
  ): Promise<void> {
    // Use Brevo API if available (production)
    if (this.brevoApiInstance) {
      try {
        this.logger.log(
          `Attempting to send ${subject} email to ${email} via Brevo API...`,
        );
        await this.sendEmailViaBrevo(email, subject, html, from);
        this.logger.log(`${subject} email sent to ${email} via Brevo API`);
        return;
      } catch (error) {
        this.logger.error(
          `Failed to send ${subject} email to ${email} via Brevo API:`,
          error,
        );
        this.logger.error('Brevo API error details:', {
          message: error.message,
          status: error.status,
          response: error.response?.text,
        });
        // Fallback to SMTP if Brevo fails
        this.logger.log('Falling back to SMTP...');
      }
    }

    // Use SMTP (Gmail or other SMTP provider)
    const mailOptions = {
      from,
      to: email,
      subject,
      html,
    };

    try {
      this.logger.log(
        `Attempting to send ${subject} email to ${email} via SMTP...`,
      );
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

  private async sendEmailViaBrevo(
    to: string,
    subject: string,
    html: string,
    from: string,
  ): Promise<void> {
    const sendSmtpEmail = new SendSmtpEmail();

    // Extract email address from "Name <email>" format
    const fromEmail = from.match(/<(.+)>/) ? from.match(/<(.+)>/)[1] : from;

    sendSmtpEmail.sender = { name: 'Sparklory', email: fromEmail };
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;

    try {
      const response =
        await this.brevoApiInstance.sendTransacEmail(sendSmtpEmail);
      this.logger.log(`Brevo API response: ${JSON.stringify(response.body)}`);
    } catch (error) {
      this.logger.error('Brevo API send error:', error);
      throw error;
    }
  }

  private async sendEmailViaHTTP(
    to: string,
    subject: string,
    _html: string,
  ): Promise<void> {
    // Try using a simple email service that works via HTTP
    // For now, let's use a webhook-based approach or disable HTTP fallback
    this.logger.log(
      `HTTP fallback not available for ${to} - ${subject} - Gmail API requires OAuth 2.0`,
    );
    throw new Error(
      'HTTP email sending not configured - requires OAuth 2.0 setup',
    );
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
