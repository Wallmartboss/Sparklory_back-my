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
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';
import { Product } from './schema/product.schema';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  private readonly logger = new Logger(ProductController.name);
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: 201,
    description: 'The product has been successfully created.',
    type: Product,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async create(@Body() createProductDto: CreateProductDto) {
    this.logger.log('Received request to create product');
    this.logger.debug(`Action: ${createProductDto.action}`);
    this.logger.debug(
      `Reviews count: ${createProductDto.reviews?.length || 0}`,
    );
    return this.productService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({
    status: 200,
    description: 'Return all products.',
    type: [Product],
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
    description: 'Return products by category.',
    type: [Product],
  })
  @ApiResponse({ status: 404, description: 'Not Found.' })
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
  @ApiOperation({ summary: 'Get products by action' })
  @ApiResponse({
    status: 200,
    description: 'Return products by action.',
    type: [Product],
  })
  @ApiResponse({ status: 404, description: 'Not Found.' })
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

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return a single product.',
    type: Product,
  })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({
    status: 200,
    description: 'The product has been successfully updated.',
    type: Product,
  })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    this.logger.log(`Received request to update product ${id}`);
    this.logger.debug(`Action: ${updateProductDto.action}`);
    this.logger.debug(
      `Reviews count: ${updateProductDto.reviews?.length || 0}`,
    );
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({
    status: 200,
    description: 'The product has been successfully deleted.',
    type: Product,
  })
  @ApiResponse({ status: 404, description: 'Not Found.' })
  async remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }

  @Post(':id/reviews/upload')
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
    @Param('id') productId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Файл не завантажений');
    }
    return {
      message: 'Файл успішно завантажений',
      filename: file.filename,
      path: `/uploads/reviews/${file.filename}`,
    };
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get paginated reviews for a product' })
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
  async createReview(
    @Param('id') productId: string,
    @Body() reviewDto: any,
    @Req() req: Request,
  ) {
    // Если пользователь авторизован, подставляем его имя, если не указано явно
    const user = (req as any).user;
    if (user && (!reviewDto.name || reviewDto.name.trim() === '')) {
      reviewDto.name = user.name;
    }
    return this.productService.addReview(productId, reviewDto);
  }
}
