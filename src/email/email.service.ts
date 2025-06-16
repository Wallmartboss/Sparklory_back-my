import { ECondition } from '@/common';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  constructor(private configService: ConfigService) {}
  private logger = new Logger('EmailService');

  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: this.configService.get<string>('GOOGLE_EMAIL'),
      pass: this.configService.get<string>('GOOGLE_PASSWORD'),
    },
  });

  async sendEmail(email: string, token: string, condition: ECondition) {
    let subject: string;
    let html: string;

    switch (condition) {
      case ECondition.ResetPassword:
        subject = 'Password Reset Request';
        html = `
          <p>Hello,</p>
          <p>We received a request to reset your password. Please use the following confirmation code to proceed:</p>
          <p style="text-align: center; font-weight: bold; font-size: 30px;">${token}</p>
          <p>If you did not request a password reset, please ignore this email.</p>
          <p>Thank you!</p>
        `;
        break;

      case ECondition.EmailVerify:
        subject = 'Email Verification';
        html = `
          <p>Hello,</p>
          <p>Please confirm your email address by entering the following confirmation code:</p>
          <p style="text-align: center; font-weight: bold; font-size: 30px;">${token}</p>
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

    const mailOptions = {
      from: process.env.GOOGLE_EMAIL,
      to: email,
      subject,
      html,
    };

    this.transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        this.logger.error(error);
      } else {
        this.logger.log(`${subject} email sent to ${email}: ` + info.response);
      }
    });
  }
}
