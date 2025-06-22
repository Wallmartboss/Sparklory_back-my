import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { EmailService } from '../email/email.service';
import { Cart } from './cart.schema';

@Injectable()
export class CartReminderService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<Cart>,
    private readonly emailService: EmailService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async sendCartReminders() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const carts = await this.cartModel.find({
      createdAt: { $lte: oneHourAgo },
      isOrdered: false,
      reminderSent: { $ne: true },
      email: { $exists: true, $ne: null },
      items: { $not: { $size: 0 } },
    });
    for (const cart of carts) {
      await this.emailService.sendCartReminder(cart.email, cart);
      cart.reminderSent = true;
      await cart.save();
    }
  }
}
