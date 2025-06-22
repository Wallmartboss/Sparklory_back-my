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
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Cart } from './cart.schema';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { RemoveFromCartDto } from './dto/remove-from-cart.dto';

@ApiTags('Cart')
@ApiBearerAuth('JWT-auth')
@Controller('cart')
export class CartController {
  private readonly logger = new Logger(CartController.name);
  constructor(private readonly cartService: CartService) {}

  @UseGuards(JwtAuthGuard)
  @Post('add')
  @ApiOperation({ summary: 'Add an item to the cart' })
  @ApiResponse({
    status: 201,
    description: 'The item has been successfully added to the cart.',
    type: Cart,
  })
  addItem(@Req() req, @Body() addToCartDto: AddToCartDto) {
    return this.cartService.addItem(
      req.user?.id,
      undefined,
      addToCartDto.productId,
      addToCartDto.quantity || 1,
      addToCartDto.size,
      addToCartDto.color,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get the user cart' })
  @ApiResponse({
    status: 200,
    description: 'Return the user cart.',
    type: Cart,
  })
  getCart(@Req() req) {
    return this.cartService.getOrCreateCart(req.user.id);
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
    type: Cart,
  })
  getGuestCart(@Query('guestId') guestId: string) {
    if (!guestId) {
      throw new BadRequestException('guestId is required');
    }
    return this.cartService.getOrCreateCart(undefined, guestId);
  }

  @Post('add-guest')
  @ApiOperation({ summary: 'Add an item to the guest cart' })
  @ApiResponse({
    status: 201,
    description: 'The item has been successfully added to the guest cart.',
    type: Cart,
  })
  addItemGuest(@Body() addToCartDto: AddToCartDto) {
    if (!addToCartDto.guestId) {
      throw new BadRequestException('guestId is required');
    }
    return this.cartService.addItem(
      undefined,
      addToCartDto.guestId,
      addToCartDto.productId,
      addToCartDto.quantity || 1,
      addToCartDto.size,
      addToCartDto.color,
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
}
