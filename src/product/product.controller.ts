import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Logger,
  Param,
  NotFoundException,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('products')
export class ProductController {
  private readonly logger = new Logger(ProductController.name);
  constructor(private readonly productService: ProductService) {}

  @Post()
  async create(@Body() createProductDto: CreateProductDto) {
    this.logger.log('Received request to create product');
    this.logger.debug(`Action: ${createProductDto.action}`);
    this.logger.debug(
      `Reviews count: ${createProductDto.reviews?.length || 0}`,
    );
    return this.productService.create(createProductDto);
  }

  @Get()
  async findAll() {
    return this.productService.findAll();
  }

  @Get('category/:category')
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
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @ApiExcludeEndpoint()
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
}
