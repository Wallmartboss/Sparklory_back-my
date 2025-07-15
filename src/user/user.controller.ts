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
  @ApiResponse({
    status: 200,
    description: 'User profile',
    schema: {
      example: {
        _id: '67c73504f555f43ff7a6ab8e',
        email: 'wall.mart.boss@proton.me',
        name: 'Wall Mart Boss',
        role: 'user',
        image: 'https://example.com/image.jpg',
        isLoggedIn: true,
        isVerifyEmail: false,
        createdAt: '2025-03-04T17:14:44.832Z',
        updatedAt: '2025-03-04T17:14:44.833Z',
        wishlist: ['60d21b4667d0d8992e610c85', '60d21b4967d0d8992e610c86'],
        facebookId: '1234567890',
        googleId: 'abcdefg123456',
        resetPasswordCode: '123456',
      },
    },
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
  @ApiResponse({
    status: 200,
    description: 'Product added to wishlist',
    schema: {
      example: {
        _id: '67c73504f555f43ff7a6ab8e',
        email: 'wall.mart.boss@proton.me',
        name: 'Wall Mart Boss',
        role: 'user',
        image: 'https://example.com/image.jpg',
        isLoggedIn: true,
        isVerifyEmail: false,
        createdAt: '2025-03-04T17:14:44.832Z',
        updatedAt: '2025-03-04T17:14:44.833Z',
        wishlist: ['60d21b4667d0d8992e610c85', '60d21b4967d0d8992e610c86'],
        facebookId: '1234567890',
        googleId: 'abcdefg123456',
        resetPasswordCode: '123456',
      },
    },
  })
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
  @ApiResponse({
    status: 200,
    description: 'List of products in wishlist',
    schema: {
      example: [
        {
          _id: '60f7c2b8e1d2c8001c8e4c1a',
          name: 'Amethyst Earrings',
          description: 'Earrings with white gold and amethysts',
          category: 'earrings',
          engraving: true,
          image: ['12345678.jpg'],
          action: ['Spring sale'],
          prod_collection: 'Spring 2025',
          discount: 30,
          discountStart: '2025-07-10T00:00:00.000Z',
          discountEnd: '2025-07-20T23:59:59.000Z',
          subcategory: ['casual', 'sport'],
          gender: 'unisex',
          details: ['Handmade', '925 Silver', 'Gift box included'],
          reviews: [
            {
              name: 'Ivan',
              avatar: 'avatar123.jpg',
              text: 'Great product!',
              rating: 5,
              createdAt: '20.10.2024',
              image: ['reviewImage1.jpg'],
            },
          ],
          variants: [
            {
              material: 'silver',
              size: 'L',
              price: 8000,
              insert: 'Silver',
              inStock: 7,
            },
            {
              material: 'white gold',
              size: 'M',
              price: 12200,
              insert: 'White Gold',
              inStock: 5,
            },
          ],
        },
      ],
    },
  })
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
