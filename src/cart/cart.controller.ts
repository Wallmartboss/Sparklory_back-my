import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';

@Controller('cart')
export class CartController {
  private readonly logger = new Logger(CartController.name);
  constructor(private readonly cartService: CartService) {}

  @UseGuards(JwtAuthGuard)
  @Post('add')
  addItem(
    @Req() req,
    @Body()
    body: {
      productId: string;
      quantity?: number;
      size?: string;
      color?: string;
    },
  ) {
    return this.cartService.addItem(
      req.user.id,
      body.productId,
      body.quantity || 1,
      body.size,
      body.color,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  getCart(@Req() req) {
    return this.cartService.getOrCreateCart(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('remove')
  removeItem(
    @Req() req,
    @Body() body: { productId: string; size?: string; color?: string },
  ) {
    return this.cartService.removeItem(
      req.user.id,
      body.productId,
      body.size,
      body.color,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('clear')
  clearCart(@Req() req) {
    return this.cartService.clearCart(req.user.id);
  }
}
