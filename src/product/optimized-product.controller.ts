import {
  Controller,
  Get,
  Logger,
  Query,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { TransformInterceptor } from '../core/interceptors/transform.interceptor';
import { OptimizedProductQueryDto } from './dto/optimized-product-query.dto';
import { OptimizedProductResult } from './interfaces/optimized-product.interface';
import { ProductService } from './product.service';

@ApiTags('Optimized Products')
@Controller('optimized-products')
@UseInterceptors(TransformInterceptor)
export class OptimizedProductController {
  private readonly logger = new Logger(OptimizedProductController.name);

  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({
    summary: 'Get products with advanced optimization',
    description: `
      Retrieves products with advanced caching, filtering, and performance monitoring.
      
      **Features:**
      - 🚀 **Caching**: Automatic caching with 5-minute TTL
      - 🔍 **Advanced Filtering**: Filter by category, material, price, etc.
      - 📊 **Performance Monitoring**: Real-time execution time tracking
      - 📄 **Pagination**: Efficient pagination with metadata
      - 🎯 **Text Search**: Full-text search across product fields
      
      **Example Usage:**
      \`\`\`
      GET /api/v1/optimized-products?category=earrings&material=gold&limit=10&page=1
      \`\`\`
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns optimized products with performance metrics.',
    schema: {
      type: 'object',
      properties: {
        total: {
          type: 'number',
          description: 'Total number of products matching filters',
        },
        page: { type: 'number', description: 'Current page number' },
        limit: { type: 'number', description: 'Number of products per page' },
        pages: { type: 'number', description: 'Total number of pages' },
        hasNext: {
          type: 'boolean',
          description: 'Whether there is a next page',
        },
        hasPrev: {
          type: 'boolean',
          description: 'Whether there is a previous page',
        },
        executionTime: {
          type: 'number',
          description: 'Query execution time in milliseconds',
        },
        cacheHit: {
          type: 'boolean',
          description: 'Whether the result was served from cache',
        },
        products: {
          type: 'array',
          description: 'Array of product objects',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', description: 'Product ID' },
              name: { type: 'string', description: 'Product name' },
              description: {
                type: 'string',
                description: 'Product description',
              },
              category: { type: 'string', description: 'Product category' },
              price: { type: 'number', description: 'Product price' },
              discount: { type: 'number', description: 'Discount percentage' },
            },
          },
        },
      },
    },
  })
  async getProductsOptimized(
    @Query() query: OptimizedProductQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<OptimizedProductResult> {
    this.logger.log(
      `Optimized endpoint called with query: ${JSON.stringify(query)}`,
    );

    // Set headers to prevent browser caching for Swagger UI
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    try {
      const startTime = Date.now();

      // Use the optimized service method
      const result = await this.productService.getProductsOptimized(query);

      const totalTime = Date.now() - startTime;
      this.logger.log(`Optimized endpoint completed in ${totalTime}ms`);

      return {
        ...result,
        executionTime: totalTime,
      };
    } catch (error) {
      this.logger.error(
        `Error in getProductsOptimized: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search products with text optimization',
    description: 'Performs text search with caching and performance monitoring',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns search results with performance metrics.',
  })
  async searchProducts(
    @Query('q') searchText: string,
    @Query() options: OptimizedProductQueryDto,
  ): Promise<OptimizedProductResult> {
    this.logger.log(`Search endpoint called with text: "${searchText}"`);

    try {
      const startTime = Date.now();

      const result = await this.productService.searchProducts(searchText, {
        limit: options.limit,
        page: options.page,
        category: options.category,
        useCache: options.useCache,
      });

      const totalTime = Date.now() - startTime;
      this.logger.log(`Search endpoint completed in ${totalTime}ms`);

      return {
        ...result,
        executionTime: totalTime,
      };
    } catch (error) {
      this.logger.error(
        `Error in searchProducts: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  @Get('bulk')
  @ApiOperation({
    summary: 'Get multiple products by IDs with optimization',
    description:
      'Retrieves multiple products efficiently using bulk operations',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns bulk products with performance metrics.',
  })
  async getProductsBulk(
    @Query('ids') productIds: string,
    @Query() options: OptimizedProductQueryDto,
  ): Promise<any> {
    this.logger.log(
      `Bulk products endpoint called with ${productIds.split(',').length} IDs`,
    );

    try {
      const startTime = Date.now();

      const ids = productIds.split(',').map(id => id.trim());
      const result = await this.productService.getProductsBulk({
        productIds: ids,
        useCache: options.useCache,
        fields: options.fields,
        includeVariants: true,
        includeReviews: false,
        maxReviews: 3,
      });

      const totalTime = Date.now() - startTime;
      this.logger.log(`Bulk products endpoint completed in ${totalTime}ms`);

      return {
        ...result,
        executionTime: totalTime,
      };
    } catch (error) {
      this.logger.error(
        `Error in getProductsBulk: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  @Get('cache/clear')
  @ApiOperation({
    summary: 'Clear product cache',
    description: 'Clears all cached product data to ensure fresh data',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache cleared successfully.',
  })
  async clearCache(): Promise<{ message: string; clearedKeys: string[] }> {
    this.logger.log('Cache clear endpoint called');

    try {
      const clearedKeys = await this.productService.clearProductCache();
      this.logger.log(
        `Cache cleared successfully. Cleared keys: ${clearedKeys.length}`,
      );

      return {
        message: 'Product cache cleared successfully',
        clearedKeys,
      };
    } catch (error) {
      this.logger.error(
        `Error clearing cache: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  @Get('test')
  @ApiOperation({
    summary: 'Simple test endpoint',
    description: 'Returns simple test response for health checking',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns simple test response.',
  })
  async testSimple() {
    this.logger.log('Test simple endpoint called');
    return {
      message: 'Optimized product endpoints are working!',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      features: [
        'Caching',
        'Performance monitoring',
        'Advanced filtering',
        'Bulk operations',
        'Text search',
      ],
    };
  }
}
