import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Coupon } from './coupon.schema';

@Injectable()
export class CouponService {
  constructor(@InjectModel(Coupon.name) private couponModel: Model<Coupon>) {}

  /**
   * Створює новий купон
   */
  async createCoupon(data: Partial<Coupon>): Promise<Coupon> {
    // amount або percent, але не обидва
    if ((data.amount && data.percent) || (!data.amount && !data.percent)) {
      throw new BadRequestException(
        'Coupon must have either amount or percent, not both.',
      );
    }
    return this.couponModel.create(data);
  }

  /**
   * Пошук купона за кодом і перевірка валідності
   */
  async findValidCoupon(code: string): Promise<Coupon> {
    const now = new Date();
    const coupon = await this.couponModel.findOne({ code });
    if (!coupon) throw new NotFoundException('Coupon not found');
    if (coupon.startDate > now || coupon.expiryDate < now) {
      throw new BadRequestException('Coupon is not valid');
    }
    return coupon;
  }

  /**
   * Повертає всі купони (для адмінки)
   */
  async getAll(): Promise<Coupon[]> {
    return this.couponModel.find();
  }
}
