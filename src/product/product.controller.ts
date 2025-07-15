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
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CreateProductDto, ReviewDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  private readonly logger = new Logger(ProductController.name);
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: 201,
    description: 'Product successfully created.',
    schema: {
      example: {
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
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async create(@Body() createProductDto: CreateProductDto) {
    this.logger.log('Received request to create product');
    this.logger.debug(`Action: ${createProductDto.action}`);
    this.logger.debug(
      `Number of reviews: ${createProductDto.reviews?.length || 0}`,
    );
    return this.productService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({
    status: 200,
    description: 'Returns all products.',
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
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of products per page',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  async findAll(@Query('limit') limit?: number, @Query('page') page?: number) {
    return this.productService.findAll({ limit, page });
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
  @ApiOperation({ summary: 'Get all unique product categories' })
  @ApiResponse({
    status: 200,
    description: 'Returns all unique product categories.',
    type: [String],
  })
  async getAllCategories() {
    return this.productService.getAllCategories();
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
    },
  })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product' })
  @ApiBody({
    description: 'Product update data',
    required: true,
    schema: {
      example: {
        name: 'Updated Amethyst Earrings',
        discount: 25,
        details: ['Limited edition', 'Handmade'],
        variants: [
          {
            material: 'silver',
            size: 'L',
            price: 8500,
            insert: 'Silver',
            inStock: 10,
          },
          {
            material: 'white gold',
            size: 'M',
            price: 13000,
            insert: 'White Gold',
            inStock: 6,
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Product successfully updated.',
    schema: {
      example: {
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
    },
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
    },
  })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async remove(@Param('id') id: string) {
    return this.productService.remove(id);
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
}
