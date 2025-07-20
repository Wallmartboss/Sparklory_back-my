import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { UserDecorator } from '@/common/decorators/user.decorator';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { Coupon } from './coupon.schema';
import { CouponService } from './coupon.service';

@ApiTags('Coupons')
@UseGuards(JwtAuthGuard)
@Controller('coupon')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  /**
   * Create a new coupon
   */
  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create one or multiple coupons (admin only)' })
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
  async create(
    @UserDecorator() requester: any,
    @Body() body: Partial<Coupon> | Partial<Coupon>[],
  ) {
    if (Array.isArray(body)) {
      return Promise.all(
        body.map(dto => this.couponService.createCoupon(dto, requester)),
      );
    }
    return this.couponService.createCoupon(body, requester);
  }

  /**
   * Get all coupons
   */
  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all coupons (admin)' })
  @ApiResponse({ status: 200, description: 'List of coupons', type: [Coupon] })
  async getAll(@UserDecorator() requester: any): Promise<Coupon[]> {
    if (!requester) {
      throw new BadRequestException(
        'User is not authenticated. Please provide a valid JWT token.',
      );
    }
    if (requester.role !== 'admin' && requester.role !== 'superadmin') {
      throw new BadRequestException(
        'Only admin or superadmin can access this endpoint. Your role: ' +
          requester.role,
      );
    }
    // Returns all coupons
    return this.couponService.getAll();
  }

  /**
   * Get coupon by code
   */
  @ApiBearerAuth('JWT-auth')
  @Get(':code')
  @ApiOperation({ summary: 'Get coupon by code (auth required)' })
  @ApiResponse({ status: 200, description: 'Coupon', type: Coupon })
  async getByCode(@Param('code') code: string): Promise<Coupon> {
    // Returns coupon by code
    return this.couponService.findValidCoupon(code);
  }
}
