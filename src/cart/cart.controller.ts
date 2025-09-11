import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Cart } from './cart.schema';
import { CartService } from './cart.service';
import { AddToCartDto, AddToCartGuestDto } from './dto/add-to-cart.dto';
import { ApplyBonusDto } from './dto/apply-bonus.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';
import { CartDto } from './dto/cart.dto';
import { RemoveFromCartDto } from './dto/remove-from-cart.dto';

@ApiTags('Cart')
@ApiBearerAuth('JWT-auth')
@Controller('cart')
export class CartController {
  private readonly logger = new Logger(CartController.name);
  constructor(private readonly cartService: CartService) {}

  @UseGuards(JwtAuthGuard)
  @Post('add')
  @ApiOperation({
    summary:
      'Add an item to the cart (price is calculated automatically, including discount if active)',
  })
  @ApiResponse({
    status: 201,
    description:
      'The item has been successfully added to the cart. Price is calculated on the server, including discount if active.',
    type: CartDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request, insufficient stock, or variant not found.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'Insufficient stock. Available: 3, Requested: 4',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  async addItem(@Req() req, @Body() addToCartDto: AddToCartDto) {
    try {
      return await this.cartService.addItem(
        req.user?.id,
        undefined,
        addToCartDto.productId,
        addToCartDto.quantity || 1,
        addToCartDto.size,
        addToCartDto.material,
        addToCartDto.insert,
      );
    } catch (error) {
      if (error.message.includes('Product not found')) {
        throw new BadRequestException('Product not found');
      }
      if (error.message.includes('Variant not found')) {
        throw new BadRequestException(error.message);
      }
      if (error.message.includes('Insufficient stock')) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Error adding item to cart');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get the user cart' })
  @ApiResponse({
    status: 200,
    description: 'Return the user cart.',
    type: CartDto,
  })
  async getCart(@Req() req) {
    const cart = await this.cartService.getOrCreateCart(req.user.id);
    await this.cartService.updateCartItemsPrices(cart);
    await this.cartService.recalculateTotals(cart);
    return {
      items: cart.items.map(item => ({
        product: item.product.toString(),
        quantity: item.quantity,
        size: item.size,
        material: item.material,
        insert: item.insert,
        firstPrice: item.firstPrice,
        discount: item.discount,
        priceWithDiscount: item.priceWithDiscount,
      })),
      preTotal: cart.preTotal,
      finalTotal: cart.finalTotal,
      appliedCoupon: cart.appliedCoupon,
      appliedBonus: cart.appliedBonus,
      firstAmount: cart.firstAmount,
      totalDiscount: cart.totalDiscount,
      amountWithDiscount: cart.amountWithDiscount,
      finalAmount: cart.finalAmount,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('remove')
  @ApiOperation({ summary: 'Remove an item from the cart' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['productId'],
      properties: {
        productId: { type: 'string', example: '60d21b4667d0d8992e610c85' },
        size: { type: 'string', example: '17.5', description: 'optional' },
        material: { type: 'string', example: 'gold', description: 'optional' },
        insert: { type: 'string', example: 'diamond', description: 'optional' },
      },
      description: 'For authenticated users',
    },
  })
  @ApiResponse({
    status: 200,
    description: 'The item has been successfully removed from the cart.',
    type: Cart,
  })
  removeItem(@Req() req, @Body() removeFromCartDto: RemoveFromCartDto) {
    // Overload for authenticated users: (userId, productId, size, material, insert)
    return this.cartService.removeItem(
      req.user.id,
      removeFromCartDto.productId,
      removeFromCartDto.size,
      removeFromCartDto.material,
      removeFromCartDto.insert,
    ) as any;
  }

  @UseGuards(JwtAuthGuard)
  @Post('clear')
  @ApiOperation({ summary: 'Clear the user cart' })
  @ApiResponse({
    status: 200,
    description: 'The cart has been successfully cleared.',
    type: Cart,
  })
  async clearCart(@Req() req) {
    try {
      console.log('[DEBUG][CartController.clearCart] User ID:', req.user.id);
      const result = await this.cartService.clearCart(req.user.id);
      console.log(
        '[DEBUG][CartController.clearCart] Cart cleared successfully',
      );
      return result;
    } catch (error) {
      console.error('[ERROR][CartController.clearCart] Error:', error);
      throw error;
    }
  }

  @Get('guest')
  @ApiOperation({ summary: 'Get or create guest cart by guestId' })
  @ApiResponse({
    status: 200,
    description: 'Return the guest cart.',
    type: CartDto,
  })
  async getGuestCart(@Query('guestId') guestId: string) {
    if (!guestId) {
      throw new BadRequestException('guestId is required');
    }
    const cart = await this.cartService.getOrCreateCart(undefined, guestId);
    return {
      items: cart.items.map(item => ({
        product: item.product.toString(),
        quantity: item.quantity,
        size: item.size,
        material: item.material,
        insert: item.insert,
        firstPrice: item.firstPrice,
        discount: item.discount,
        priceWithDiscount: item.priceWithDiscount,
      })),
      preTotal: cart.preTotal,
      finalTotal: cart.finalTotal,
      appliedCoupon: cart.appliedCoupon,
      appliedBonus: cart.appliedBonus,
      firstAmount: cart.firstAmount,
      totalDiscount: cart.totalDiscount,
      amountWithDiscount: cart.amountWithDiscount,
      finalAmount: cart.finalAmount,
    };
  }

  @Post('add-guest')
  @ApiOperation({
    summary:
      'Add an item to the guest cart (price is calculated automatically, including discount if active)',
  })
  @ApiBody({
    schema: {
      example: {
        productId: '60d21b4667d0d8992e610c85',
        quantity: 1,
        size: '17.5',
        material: 'gold',
        insert: 'diamond',
        guestId: 'c0a8012e-7b2a-4c1a-9e2a-123456789abc',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description:
      'The item has been successfully added to the guest cart. Price is calculated on the server, including discount if active.',
    type: CartDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request, insufficient stock, or variant not found.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'Insufficient stock. Available: 3, Requested: 4',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  async addItemGuest(@Body() addToCartDto: AddToCartGuestDto) {
    if (!addToCartDto.guestId) {
      throw new BadRequestException('guestId is required');
    }
    try {
      return await this.cartService.addItem(
        undefined,
        addToCartDto.guestId,
        addToCartDto.productId,
        addToCartDto.quantity || 1,
        addToCartDto.size,
        addToCartDto.material,
        addToCartDto.insert,
      );
    } catch (error) {
      if (error.message.includes('Product not found')) {
        throw new BadRequestException('Product not found');
      }
      if (error.message.includes('Variant not found')) {
        throw new BadRequestException(error.message);
      }
      if (error.message.includes('Insufficient stock')) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Error adding item to cart');
    }
  }

  @Post('remove-guest')
  @ApiOperation({ summary: 'Remove an item from the guest cart' })
  @ApiResponse({
    status: 200,
    description: 'The item has been successfully removed from the guest cart.',
    type: Cart,
  })
  removeItemGuest(@Body() removeFromCartDto: RemoveFromCartDto) {
    if (!removeFromCartDto.guestId) {
      throw new BadRequestException('guestId is required');
    }
    return this.cartService.removeItem(
      undefined,
      removeFromCartDto.guestId,
      removeFromCartDto.productId,
      removeFromCartDto.size,
      removeFromCartDto.material,
      removeFromCartDto.insert,
    );
  }

  @Post('clear-guest')
  @ApiOperation({ summary: 'Clear the guest cart' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['guestId'],
      properties: {
        guestId: {
          type: 'string',
          example: 'c0a8012e-7b2a-4c1a-9e2a-123456789abc',
          description: 'Guest cart/session ID',
        },
      },
      example: {
        guestId: 'c0a8012e-7b2a-4c1a-9e2a-123456789abc',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'The guest cart has been successfully cleared.',
    type: Cart,
  })
  clearGuestCart(@Body() body: { guestId: string }) {
    if (!body.guestId) {
      throw new BadRequestException('guestId is required');
    }
    console.log(
      '[DEBUG][CartController.clearGuestCart] Guest ID:',
      body.guestId,
    );
    return this.cartService.clearCart(undefined, body.guestId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('apply-coupon')
  @ApiOperation({ summary: 'Apply a coupon to the cart' })
  @ApiBody({ type: ApplyCouponDto })
  @ApiResponse({ status: 200, description: 'Coupon applied', type: CartDto })
  async applyCoupon(
    @Req() req,
    @Body() body: ApplyCouponDto,
  ): Promise<CartDto> {
    if (!req.user || !req.user.id) {
      throw new BadRequestException('User not authenticated');
    }
    // Applies a coupon to the user's cart
    const cart = await this.cartService.applyCoupon(req.user.id, body.code);
    return {
      items: cart.items.map(item => ({
        product: item.product.toString(),
        quantity: item.quantity,
        size: item.size,
        material: item.material,
        insert: item.insert,
        firstPrice: item.firstPrice,
        discount: item.discount,
        priceWithDiscount: item.priceWithDiscount,
      })),
      preTotal: cart.preTotal,
      finalTotal: cart.finalTotal,
      appliedCoupon: cart.appliedCoupon,
      appliedBonus: cart.appliedBonus,
      firstAmount: cart.firstAmount,
      totalDiscount: cart.totalDiscount,
      amountWithDiscount: cart.amountWithDiscount,
      finalAmount: cart.finalAmount,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('apply-bonus')
  @ApiOperation({ summary: 'Apply bonuses to the cart' })
  @ApiBody({ type: ApplyBonusDto })
  @ApiResponse({
    status: 200,
    description: 'Bonuses applied',
    type: CartDto,
  })
  async applyBonus(@Req() req, @Body() body: ApplyBonusDto): Promise<CartDto> {
    if (!req.user || !req.user.id) {
      throw new BadRequestException('User not authenticated');
    }
    const cart = await this.cartService.applyBonus(req.user.id, body.amount);
    return {
      items: cart.items.map(item => ({
        product: item.product.toString(),
        quantity: item.quantity,
        size: item.size,
        material: item.material,
        insert: item.insert,
        firstPrice: item.firstPrice,
        discount: item.discount,
        priceWithDiscount: item.priceWithDiscount,
      })),
      preTotal: cart.preTotal,
      finalTotal: cart.finalTotal,
      appliedCoupon: cart.appliedCoupon,
      appliedBonus: cart.appliedBonus,
      firstAmount: cart.firstAmount,
      totalDiscount: cart.totalDiscount,
      amountWithDiscount: cart.amountWithDiscount,
      finalAmount: cart.finalAmount,
    };
  }

  @Post('apply-coupon-guest')
  @ApiOperation({ summary: 'Apply a coupon to the guest cart' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        guestId: { type: 'string', example: 'guest-uuid' },
        code: { type: 'string', example: 'WELCOME2024' },
      },
      required: ['guestId', 'code'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Coupon applied to guest cart',
    type: CartDto,
  })
  async applyCouponGuest(
    @Body() body: { guestId: string; code: string },
  ): Promise<CartDto> {
    if (!body.guestId) {
      throw new BadRequestException('guestId is required');
    }
    if (!body.code) {
      throw new BadRequestException('Coupon code is required');
    }
    const cart = await this.cartService.applyCouponGuest(
      body.guestId,
      body.code,
    );
    return {
      items: cart.items.map(item => ({
        product: item.product.toString(),
        quantity: item.quantity,
        size: item.size,
        material: item.material,
        insert: item.insert,
        firstPrice: item.firstPrice,
        discount: item.discount,
        priceWithDiscount: item.priceWithDiscount,
      })),
      preTotal: cart.preTotal,
      finalTotal: cart.finalTotal,
      appliedCoupon: cart.appliedCoupon,
      appliedBonus: cart.appliedBonus,
      firstAmount: cart.firstAmount,
      totalDiscount: cart.totalDiscount,
      amountWithDiscount: cart.amountWithDiscount,
      finalAmount: cart.finalAmount,
    };
  }
}
