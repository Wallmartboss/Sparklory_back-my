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
import { ProductDto } from './dto/product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';
import { Product } from './schema/product.schema';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  private readonly logger = new Logger(ProductController.name);
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({ summary: 'Створити новий продукт' })
  @ApiResponse({
    status: 201,
    description: 'Продукт успішно створено.',
    type: Product,
  })
  @ApiResponse({ status: 400, description: 'Поганий запит.' })
  async create(@Body() createProductDto: CreateProductDto) {
    this.logger.log('Отримано запит на створення продукту');
    this.logger.debug(`Дія: ${createProductDto.action}`);
    this.logger.debug(
      `Кількість відгуків: ${createProductDto.reviews?.length || 0}`,
    );
    return this.productService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Отримати всі продукти' })
  @ApiResponse({
    status: 200,
    description: 'Повертає всі продукти.',
    type: [ProductDto],
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Кількість продуктів на сторінку',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Номер сторінки',
  })
  async findAll(@Query('limit') limit?: number, @Query('page') page?: number) {
    return this.productService.findAll({ limit, page });
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Отримати продукти за категорією' })
  @ApiResponse({
    status: 200,
    description: 'Повертає продукти за категорією.',
    type: [Product],
  })
  @ApiResponse({ status: 404, description: 'Не знайдено.' })
  async findByCategory(@Param('category') category: string) {
    this.logger.log(`Отримання продуктів за категорією: ${category}`);
    try {
      return await this.productService.findByCategory(category);
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(error.message);
        throw error;
      }
      this.logger.error(
        `Помилка при отриманні продуктів за категорією: ${error.message}`,
      );
      throw new Error('Помилка при отриманні продуктів за категорією');
    }
  }

  @Get('action/:action')
  @ApiOperation({ summary: 'Отримати продукти за дією' })
  @ApiResponse({
    status: 200,
    description: 'Повертає продукти за дією.',
    type: [Product],
  })
  @ApiResponse({ status: 404, description: 'Не знайдено.' })
  async findByAction(@Param('action') action: string) {
    this.logger.log(`Отримання продуктів за акцією: ${action}`);
    try {
      return await this.productService.findByAction(action);
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(error.message);
        throw error;
      }
      this.logger.error(
        `Помилка при отриманні продуктів за акцією: ${error.message}`,
      );
      throw new Error('Помилка при отриманні продуктів за акцією');
    }
  }

  @Get('discounts')
  @ApiOperation({ summary: 'Отримати всі продукти зі знижкою (discount > 0)' })
  @ApiResponse({
    status: 200,
    description: 'Повертає всі продукти зі знижкою.',
    type: [ProductDto],
  })
  async findDiscountedProducts() {
    return this.productService.findDiscounted();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Отримати всі унікальні категорії продуктів' })
  @ApiResponse({
    status: 200,
    description: 'Повертає всі унікальні категорії продуктів.',
    type: [String],
  })
  async getAllCategories() {
    return this.productService.getAllCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Отримати продукт за ID' })
  @ApiResponse({
    status: 200,
    description: 'Повертає один продукт.',
    type: Product,
  })
  @ApiResponse({ status: 404, description: 'Не знайдено.' })
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Оновити продукт' })
  @ApiResponse({
    status: 200,
    description: 'Продукт успішно оновлено.',
    type: Product,
  })
  @ApiResponse({ status: 404, description: 'Не знайдено.' })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    this.logger.log(`Отримано запит на оновлення продукту ${id}`);
    this.logger.debug(`Дія: ${updateProductDto.action}`);
    this.logger.debug(
      `Кількість відгуків: ${updateProductDto.reviews?.length || 0}`,
    );
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Видалити продукт' })
  @ApiResponse({
    status: 200,
    description: 'Продукт успішно видалено.',
    type: Product,
  })
  @ApiResponse({ status: 404, description: 'Не знайдено.' })
  async remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }

  @Post(':productId/reviews/:reviewId/upload')
  @ApiOperation({ summary: 'Завантажити зображення для конкретного відгуку' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Зображення відгуку (jpg, jpeg, png, gif, max 5MB)',
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
            new BadRequestException('Дозволені тільки зображення'),
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
      throw new BadRequestException('Файл не завантажено');
    }
    const imagePath = `/uploads/reviews/${file.filename}`;
    await this.productService.attachImageToReview(
      productId,
      reviewId,
      imagePath,
    );
    return {
      message: 'Зображення завантажено та прикріплено до відгуку',
      filename: file.filename,
      path: imagePath,
    };
  }

  @Get(':id/reviews')
  @ApiOperation({
    summary: 'Отримати сторінковану інформацію про відгуки для продукту',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Номер сторінки',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Кількість відгуків на сторінку',
  })
  @ApiResponse({
    status: 200,
    description: 'Сторінкована інформація про відгуки',
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
  @ApiOperation({ summary: 'Створити відгук для продукту' })
  @ApiBody({
    type: ReviewDto,
    description: 'Дані відгуку',
    examples: {
      example1: {
        summary: 'Відгук з усіма полями',
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
        summary: 'Простий відгук',
        value: {
          name: 'Jane Smith',
          text: 'Good quality',
          rating: 4,
          createdAt: '21.10.2024',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Створено відгук', type: ReviewDto })
  async createReview(
    @Param('id') productId: string,
    @Body() reviewDto: any,
    @Req() req: Request,
  ) {
    // Якщо користувач авторизований, підставляємо його ім'я, якщо не вказано явно
    const user = (req as any).user;
    if (user && (!reviewDto.name || reviewDto.name.trim() === '')) {
      reviewDto.name = user.name;
    }
    const review = await this.productService.addReview(productId, reviewDto);
    return review;
  }
}
