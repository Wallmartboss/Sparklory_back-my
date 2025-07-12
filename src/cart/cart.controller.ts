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
  addItem(@Req() req, @Body() addToCartDto: AddToCartDto) {
    return this.cartService.addItem(
      req.user?.id,
      undefined,
      addToCartDto.productId,
      addToCartDto.quantity || 1,
      addToCartDto.size,
      addToCartDto.material,
      addToCartDto.insert,
      undefined,
    );
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
    const total = cart.items.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
      0,
    );
    return { ...cart.toObject(), total };
  }

  @UseGuards(JwtAuthGuard)
  @Post('remove')
  @ApiOperation({ summary: 'Remove an item from the cart' })
  @ApiResponse({
    status: 200,
    description: 'The item has been successfully removed from the cart.',
    type: Cart,
  })
  removeItem(@Req() req, @Body() removeFromCartDto: RemoveFromCartDto) {
    return this.cartService.removeItem(
      req.user.id,
      removeFromCartDto.productId,
      removeFromCartDto.size,
      removeFromCartDto.color,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('clear')
  @ApiOperation({ summary: 'Clear the user cart' })
  @ApiResponse({
    status: 200,
    description: 'The cart has been successfully cleared.',
    type: Cart,
  })
  clearCart(@Req() req) {
    return this.cartService.clearCart(req.user.id);
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
    const total = cart.items.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
      0,
    );
    return { ...cart.toObject(), total };
  }

  @Post('add-guest')
  @ApiOperation({
    summary:
      'Add an item to the guest cart (price is calculated automatically, including discount if active)',
  })
  @ApiResponse({
    status: 201,
    description:
      'The item has been successfully added to the guest cart. Price is calculated on the server, including discount if active.',
    type: CartDto,
  })
  addItemGuest(@Body() addToCartDto: AddToCartGuestDto) {
    if (!addToCartDto.guestId) {
      throw new BadRequestException('guestId is required');
    }
    return this.cartService.addItem(
      undefined,
      addToCartDto.guestId,
      addToCartDto.productId,
      addToCartDto.quantity || 1,
      addToCartDto.size,
      addToCartDto.material,
      addToCartDto.insert,
      addToCartDto.email,
    );
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
      removeFromCartDto.color,
    );
  }

  @Post('apply-coupon')
  @ApiOperation({ summary: 'Застосувати купон до корзини' })
  @ApiBody({ type: ApplyCouponDto })
  @ApiResponse({ status: 200, description: 'Купон застосовано', type: CartDto })
  async applyCoupon(
    @Req() req,
    @Body() body: ApplyCouponDto,
  ): Promise<CartDto> {
    // Застосовує купон до кошику користувача
    const cart = await this.cartService.applyCoupon(req.user.id, body.code);
    return {
      items: cart.items.map(item => ({
        product: item.product.toString(),
        quantity: item.quantity,
        size: item.size,
        material: item.material,
        insert: item.insert,
        price: item.price,
      })),
      preTotal: cart.preTotal,
      finalTotal: cart.finalTotal,
      appliedCoupon: cart.appliedCoupon,
      appliedBonus: cart.appliedBonus,
    };
  }

  @Post('apply-bonus')
  @ApiOperation({ summary: 'Застосувати бонуси до кошику' })
  @ApiBody({ type: ApplyBonusDto })
  @ApiResponse({
    status: 200,
    description: 'Бонуси застосовано',
    type: CartDto,
  })
  async applyBonus(@Req() req, @Body() body: ApplyBonusDto): Promise<CartDto> {
    // Застосовує бонуси до кошику користувача
    const cart = await this.cartService.applyBonus(req.user.id, body.amount);
    return {
      items: cart.items.map(item => ({
        product: item.product.toString(),
        quantity: item.quantity,
        size: item.size,
        material: item.material,
        insert: item.insert,
        price: item.price,
      })),
      preTotal: cart.preTotal,
      finalTotal: cart.finalTotal,
      appliedCoupon: cart.appliedCoupon,
      appliedBonus: cart.appliedBonus,
    };
  }
}
