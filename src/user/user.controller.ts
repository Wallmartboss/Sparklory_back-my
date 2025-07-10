import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { UserDecorator } from '@/common/decorators/user.decorator';
import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserService } from './user.service';

@ApiTags('User')
@Controller('user')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: 'view your own profile',
  })
  @Get('me')
  async me(@UserDecorator('sub') sub: string) {
    return this.userService.me(sub);
  }

  /**
   * Add a product to the user's wishlist
   */
  @Post('wishlist/:productId')
  @ApiOperation({ summary: 'Add product to wishlist' })
  @ApiParam({ name: 'productId', type: String })
  @ApiResponse({ status: 200, description: 'Product added to wishlist' })
  async addToWishlist(
    @UserDecorator('sub') sub: string,
    @Param('productId') productId: string,
  ) {
    return this.userService.addToWishlist(sub, productId);
  }

  /**
   * Get all products from the user's wishlist
   */
  @Get('wishlist')
  @ApiOperation({ summary: 'Get all products from wishlist' })
  @ApiResponse({ status: 200, description: 'List of products in wishlist' })
  async getWishlist(@UserDecorator('sub') sub: string) {
    return this.userService.getWishlist(sub);
  }

  /**
   * Remove a product from the user's wishlist
   */
  @Delete('wishlist/:productId')
  @ApiOperation({ summary: 'Remove product from wishlist by ID' })
  @ApiParam({ name: 'productId', type: String })
  @ApiResponse({ status: 200, description: 'Product removed from wishlist' })
  async removeFromWishlist(
    @UserDecorator('sub') sub: string,
    @Param('productId') productId: string,
  ) {
    return this.userService.removeFromWishlist(sub, productId);
  }

  /**
   * Clear the user's wishlist
   */
  @Delete('wishlist')
  @ApiOperation({ summary: 'Clear the wishlist (remove all products)' })
  @ApiResponse({ status: 200, description: 'Wishlist cleared' })
  async clearWishlist(@UserDecorator('sub') sub: string) {
    return this.userService.clearWishlist(sub);
  }
}
