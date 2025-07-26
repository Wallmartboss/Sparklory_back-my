import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { UserDecorator } from '../common/decorators/user.decorator';
import { CreateProductDto, ReviewDto } from './dto/create-product.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { ProductDto } from './dto/product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  private readonly logger = new Logger(ProductController.name);
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({
    summary:
      'Create one or multiple products. If the category or subcategory does not exist, they will be created automatically. If the subcategory exists but belongs to another category, an error will be thrown.',
  })
  @ApiBody({ type: CreateProductDto, isArray: true })
  @ApiResponse({
    status: 201,
    description: 'Product created',
    type: ProductDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Products created',
    type: [ProductDto],
  })
  @ApiResponse({
    status: 201,
    description: 'Product DTO',
    type: CreateProductDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Product DTO (array)',
    type: [CreateProductDto],
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async create(@Body() body: CreateProductDto | CreateProductDto[]) {
    if (Array.isArray(body)) {
      return Promise.all(body.map(dto => this.productService.create(dto)));
    }
    return this.productService.create(body);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all products with filtering, sorting, and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated products.',
    schema: {
      example: {
        total: 100,
        page: 1,
        limit: 16,
        pages: 7,
        products: [
          {
            _id: '60f7c2b8e1d2c8001c8e4c1a',
            name: 'Amethyst Earrings',
            description: 'Earrings with white gold and amethysts',
            category: '60f7c2b8e1d2c8001c8e4c1b',
            engraving: true,
            image: ['12345678.jpg'],
            action: ['Spring sale'],
            prod_collection: 'Spring 2025',
            discount: 30,
            discountStart: '2025-07-10T00:00:00.000Z',
            discountEnd: '2025-07-20T23:59:59.000Z',
            subcategory: '60f7c2b8e1d2c8001c8e4c1c',
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
    },
  })
  async findAll(@Query() query: ProductFilterDto): Promise<any> {
    // Pass all filters and options to the service
    return this.productService.findAll(query);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get products by category' })
  @ApiResponse({
    status: 200,
    description: 'Returns products by category.',
    schema: {
      example: [
        {
          _id: '60f7c2b8e1d2c8001c8e4c1a',
          name: 'Amethyst Earrings',
          description: 'Earrings with white gold and amethysts',
          category: '60f7c2b8e1d2c8001c8e4c1b',
          engraving: true,
          image: ['12345678.jpg'],
          action: ['Spring sale'],
          prod_collection: 'Spring 2025',
          discount: 30,
          discountStart: '2025-07-10T00:00:00.000Z',
          discountEnd: '2025-07-20T23:59:59.000Z',
          subcategory: '60f7c2b8e1d2c8001c8e4c1c',
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
  @ApiResponse({ status: 404, description: 'Not found.' })
  async findByCategory(@Param('category') category: string) {
    this.logger.log(`Getting products by category: ${category}`);
    try {
      return await this.productService.findByCategory(category);
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(error.message);
        throw error;
      }
      this.logger.error(`Error getting products by category: ${error.message}`);
      throw new Error('Error getting products by category');
    }
  }

  @Get('action/:action')
  @ApiOperation({ summary: 'Get products by action' })
  @ApiResponse({
    status: 200,
    description: 'Returns products by action.',
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
  @ApiResponse({ status: 404, description: 'Not found.' })
  async findByAction(@Param('action') action: string) {
    this.logger.log(`Getting products by action: ${action}`);
    try {
      return await this.productService.findByAction(action);
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(error.message);
        throw error;
      }
      this.logger.error(`Error getting products by action: ${error.message}`);
      throw new Error('Error getting products by action');
    }
  }

  @Get('discounts')
  @ApiOperation({ summary: 'Get all products with a discount (discount > 0)' })
  @ApiResponse({
    status: 200,
    description: 'Returns all products with a discount.',
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
  async findDiscountedProducts() {
    return this.productService.findDiscounted();
  }

  @Get('categories')
  @ApiOperation({
    summary: 'Get all categories with their subcategories and image',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns paginated categories with their subcategories and image.',
    schema: {
      example: {
        total: 10,
        page: 1,
        limit: 5,
        pages: 2,
        categories: [
          {
            _id: '60f7c2b8e1d2c8001c8e4c1b',
            name: 'earrings',
            image: 'https://example.com/category-image.jpg',
            parentCategory: null,
            subcategories: [
              {
                _id: '60f7c2b8e1d2c8001c8e4c1c',
                name: 'studs',
                image: 'https://example.com/subcategory-image.jpg',
              },
            ],
          },
        ],
      },
    },
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of categories per page',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  async getAllCategories(
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ): Promise<any> {
    return this.productService.getCategoriesWithSubcategories(limit, page);
  }

  @Post(':productId/reviews/:reviewId/upload')
  @ApiOperation({ summary: 'Upload image for a specific review' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Review image (jpg, jpeg, png, gif, max 5MB)',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/reviews',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(
            new BadRequestException('Only images are allowed'),
            false,
          );
        }
        callback(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    }),
  )
  async uploadReviewImage(
    @Param('productId') productId: string,
    @Param('reviewId') reviewId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File not uploaded');
    }
    const imagePath = `/uploads/reviews/${file.filename}`;
    await this.productService.attachImageToReview(
      productId,
      reviewId,
      imagePath,
    );
    return {
      message: 'Image uploaded and attached to review',
      filename: file.filename,
      path: imagePath,
    };
  }

  @Get(':id/reviews')
  @ApiOperation({
    summary: 'Get paginated information about reviews for a product',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of reviews per page',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated review information',
    schema: {
      example: {
        total: 1,
        page: 1,
        limit: 10,
        reviews: [
          {
            _id: '653e1b2c8f1b2a001e8e4c1a',
            name: 'Ivan',
            text: 'Great!',
            rating: 5,
            createdAt: '2024-10-20',
            image: ['reviewImage1.jpg'],
          },
        ],
      },
    },
  })
  async getPaginatedReviews(
    @Param('id') productId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<any> {
    return this.productService.paginateReviews(
      productId,
      Number(page),
      Number(limit),
    );
  }

  @Post(':id/reviews')
  @ApiOperation({ summary: 'Create a review for a product' })
  @ApiBody({
    type: ReviewDto,
    description: 'Review data',
    examples: {
      example1: {
        summary: 'Review with all fields',
        value: {
          name: 'John Doe',
          avatar: 'avatar123.jpg',
          text: 'Great product!',
          rating: 5,
          createdAt: '20.10.2024',
          image: ['reviewImage1.jpg'],
        },
      },
      example2: {
        summary: 'Simple review',
        value: {
          name: 'Jane Smith',
          text: 'Good quality',
          rating: 4,
          createdAt: '21.10.2024',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Review created', type: ReviewDto })
  async createReview(
    @Param('id') productId: string,
    @Body() reviewDto: any,
    @Req() req: Request,
  ) {
    // If user is authenticated, use their name, otherwise use the provided name
    const user = (req as any).user;
    if (user && (!reviewDto.name || reviewDto.name.trim() === '')) {
      reviewDto.name = user.name;
    }
    const review = await this.productService.addReview(productId, reviewDto);
    return review;
  }

  @Post('subscribe')
  @ApiOperation({
    summary: 'Subscribe to product back-in-stock notification (guest)',
  })
  @ApiBody({
    description: 'Subscription data',
    required: true,
    schema: {
      example: {
        productId: '60f7c2b8e1d2c8001c8e4c1a',
        email: 'user@example.com',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Subscription created or already exists',
    schema: {
      example: { message: 'Subscription created' },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Missing productId or email',
    schema: {
      example: { message: 'productId and email are required' },
    },
  })
  async subscribeToProductGuest(
    @Body() body: { productId: string; email: string },
  ) {
    if (!body.productId || !body.email) {
      return { message: 'productId and email are required' };
    }
    return this.productService.createSubscription(body.productId, body.email);
  }

  @Post('subscribe/auth')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary:
      'Subscribe to product back-in-stock notification (authorized user)',
  })
  @ApiBody({
    description: 'Subscription data',
    required: true,
    schema: {
      example: {
        productId: '60f7c2b8e1d2c8001c8e4c1a',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Subscription created or already exists',
    schema: {
      example: { message: 'Subscription created' },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Missing productId',
    schema: {
      example: { message: 'productId is required' },
    },
  })
  async subscribeToProductAuth(
    @Body() body: { productId: string },
    @UserDecorator('sub') userId: string,
    @UserDecorator('email') email: string,
  ) {
    if (!body.productId) {
      return { message: 'productId is required' };
    }
    return this.productService.createSubscription(
      body.productId,
      email,
      userId,
    );
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'Get all product subscriptions' })
  @ApiResponse({
    status: 200,
    description: 'Returns all product subscriptions',
    schema: {
      example: [
        {
          _id: '661f1b2c8f1b2a001e8e4c1a',
          productId: '60f7c2b8e1d2c8001c8e4c1a',
          email: 'user@example.com',
          notified: false,
          createdAt: '2024-05-01T12:00:00.000Z',
        },
      ],
    },
  })
  async getAllSubscriptions() {
    return this.productService.getAllSubscriptions();
  }

  @Get('subscriptions/user')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get all product subscriptions for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns all product subscriptions for the current user',
    schema: {
      example: [
        {
          _id: '661f1b2c8f1b2a001e8e4c1a',
          productId: '60f7c2b8e1d2c8001c8e4c1a',
          email: 'user@example.com',
          userId: '661f1b2c8f1b2a001e8e4c1b',
          notified: false,
          createdAt: '2024-05-01T12:00:00.000Z',
        },
      ],
    },
  })
  async getSubscriptionsByUser(@UserDecorator('sub') userId: string) {
    return this.productService.getSubscriptionsByUser(userId);
  }

  @Delete('subscriptions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary:
      'Unsubscribe from product notifications by subscription ID (only for current user)',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription deleted',
    schema: { example: { message: 'Unsubscribed successfully' } },
  })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async unsubscribe(
    @Param('id') id: string,
    @UserDecorator('sub') userId: string,
  ) {
    return this.productService.unsubscribeByUser(id, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns one product.',
    schema: {
      example: {
        _id: '60f7c2b8e1d2c8001c8e4c1a',
        name: 'Amethyst Earrings',
        description: 'Earrings with white gold and amethysts',
        category: '60f7c2b8e1d2c8001c8e4c1b',
        engraving: true,
        image: ['12345678.jpg'],
        action: ['Spring sale'],
        prod_collection: 'Spring 2025',
        discount: 30,
        discountStart: '2025-07-10T00:00:00.000Z',
        discountEnd: '2025-07-20T23:59:59.000Z',
        subcategory: '60f7c2b8e1d2c8001c8e4c1c',
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
    },
  })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product' })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({
    status: 200,
    description: 'Product successfully updated.',
    schema: { $ref: getSchemaPath(UpdateProductDto) },
  })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    this.logger.log(`Received request to update product ${id}`);
    this.logger.debug(`Action: ${updateProductDto.action}`);
    this.logger.debug(
      `Number of reviews: ${updateProductDto.reviews?.length || 0}`,
    );
    return this.productService.update(id, updateProductDto);
  }

  @Patch(':id/stock')
  @ApiOperation({
    summary: 'Update product stock and notify subscribers if needed',
  })
  @ApiBody({
    description: 'New stock value for the first variant',
    required: true,
    schema: {
      example: { newStock: 5 },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'Product stock updated. If product was out of stock and now in stock, subscribers will be notified.',
    schema: {
      example: {
        _id: '60f7c2b8e1d2c8001c8e4c1a',
        name: 'Amethyst Earrings',
        variants: [{ material: 'gold', size: 'M', inStock: 5 }],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async updateStock(
    @Param('id') productId: string,
    @Body() body: { newStock: number },
  ) {
    return this.productService.updateProductStock(productId, body.newStock);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product' })
  @ApiResponse({
    status: 200,
    description: 'Product successfully deleted.',
    schema: {
      example: {
        _id: '60f7c2b8e1d2c8001c8e4c1a',
        name: 'Amethyst Earrings',
        description: 'Earrings with white gold and amethysts',
        category: '60f7c2b8e1d2c8001c8e4c1b',
        engraving: true,
        image: ['12345678.jpg'],
        action: ['Spring sale'],
        prod_collection: 'Spring 2025',
        discount: 30,
        discountStart: '2025-07-10T00:00:00.000Z',
        discountEnd: '2025-07-20T23:59:59.000Z',
        subcategory: '60f7c2b8e1d2c8001c8e4c1c',
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
    },
  })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }

  @Post('compare')
  @ApiOperation({ summary: 'Compare up to 3 products by their IDs' })
  @ApiBody({
    description: 'Array of up to 3 product IDs to compare',
    required: true,
    schema: {
      example: {
        productIds: ['60f7c2b8e1d2c8001c8e4c1a', '60f7c2b8e1d2c8001c8e4c1b'],
      },
      properties: {
        productIds: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
          maxItems: 3,
          description: 'Array of product IDs (max 3)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Returns product details for comparison',
    schema: {
      example: [
        {
          _id: '60f7c2b8e1d2c8001c8e4c1a',
          name: 'Product 1',
          category: 'earrings',
          price: 1000,
        },
        {
          _id: '60f7c2b8e1d2c8001c8e4c1b',
          name: 'Product 2',
          category: 'rings',
          price: 2000,
        },
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'You must provide 1 to 3 product IDs.',
  })
  async compareProducts(@Body() body: { productIds: string[] }) {
    if (
      !Array.isArray(body.productIds) ||
      body.productIds.length === 0 ||
      body.productIds.length > 3
    ) {
      return { message: 'You must provide 1 to 3 product IDs.' };
    }
    // Find products by IDs
    const products = await this.productService.findProductsByIds(
      body.productIds,
    );
    return products;
  }
}
