import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Coupon } from './coupon.schema';
import { CouponService } from './coupon.service';

@ApiTags('Coupons')
@Controller('coupon')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  /**
   * Create a new coupon
   */
  @Post()
  @ApiOperation({ summary: 'Створити новий купон' })
  @ApiBody({ type: Coupon })
  @ApiResponse({ status: 201, description: 'Купон створено', type: Coupon })
  async create(@Body() body: Partial<Coupon>): Promise<Coupon> {
    // Створює новий купон
    return this.couponService.createCoupon(body);
  }

  /**
   * Get all coupons
   */
  @Get()
  @ApiOperation({ summary: 'Отримати всі купони' })
  @ApiResponse({ status: 200, description: 'Список купонів', type: [Coupon] })
  async getAll(): Promise<Coupon[]> {
    // Повертає всі купони
    return this.couponService.getAll();
  }

  /**
   * Get coupon by code
   */
  @Get(':code')
  @ApiOperation({ summary: 'Отримати купон за кодом' })
  @ApiResponse({ status: 200, description: 'Купон', type: Coupon })
  async getByCode(@Param('code') code: string): Promise<Coupon> {
    // Повертає купон за кодом
    return this.couponService.findValidCoupon(code);
  }
}
