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
  @ApiOperation({ summary: 'Create a new coupon' })
  @ApiBody({ type: Coupon })
  @ApiResponse({ status: 201, description: 'Coupon created', type: Coupon })
  async create(@Body() body: Partial<Coupon>): Promise<Coupon> {
    // Creates a new coupon
    return this.couponService.createCoupon(body);
  }

  /**
   * Get all coupons
   */
  @Get()
  @ApiOperation({ summary: 'Get all coupons' })
  @ApiResponse({ status: 200, description: 'List of coupons', type: [Coupon] })
  async getAll(): Promise<Coupon[]> {
    // Returns all coupons
    return this.couponService.getAll();
  }

  /**
   * Get coupon by code
   */
  @Get(':code')
  @ApiOperation({ summary: 'Get coupon by code' })
  @ApiResponse({ status: 200, description: 'Coupon', type: Coupon })
  async getByCode(@Param('code') code: string): Promise<Coupon> {
    // Returns coupon by code
    return this.couponService.findValidCoupon(code);
  }
}
