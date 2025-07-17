import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Create one or multiple coupons' })
  @ApiBody({
    description: 'Single coupon or array of coupons',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(Coupon) },
        { type: 'array', items: { $ref: getSchemaPath(Coupon) } },
      ],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Coupon or coupons successfully created.',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(Coupon) },
        { type: 'array', items: { $ref: getSchemaPath(Coupon) } },
      ],
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async create(@Body() body: Partial<Coupon> | Partial<Coupon>[]) {
    if (Array.isArray(body)) {
      return Promise.all(body.map(dto => this.couponService.createCoupon(dto)));
    }
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
