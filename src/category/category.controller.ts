import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { Category } from './category.schema';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Сategories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Add one or multiple categories' })
  @ApiBody({
    description: 'Single category or array of categories',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(CreateCategoryDto) },
        { type: 'array', items: { $ref: getSchemaPath(CreateCategoryDto) } },
      ],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Category or categories successfully created',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(Category) },
        { type: 'array', items: { $ref: getSchemaPath(Category) } },
      ],
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Category with this name already exists',
  })
  async create(
    @Body() body: CreateCategoryDto | CreateCategoryDto[],
  ): Promise<Category | Category[]> {
    if (Array.isArray(body)) {
      return Promise.all(body.map(dto => this.categoryService.create(dto)));
    }
    return this.categoryService.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories with their subcategories' })
  @ApiResponse({
    status: 200,
    description: 'List of all categories with their subcategories',
    schema: {
      example: [
        {
          name: 'earrings',
          image: 'https://example.com/category-image.jpg',
          parentCategory: null,
          subcategories: [
            {
              name: 'studs',
              image: 'https://example.com/subcategory-image.jpg',
              parentCategory: 'earrings',
            },
          ],
        },
      ],
    },
  })
  async findAll(): Promise<any[]> {
    return this.categoryService.findAllWithSubcategories();
  }

  @Get(':name')
  @ApiOperation({ summary: 'Get category by name with its subcategories' })
  @ApiParam({ name: 'name', description: 'Category name' })
  @ApiResponse({
    status: 200,
    description: 'Category found with its subcategories',
    schema: {
      example: {
        name: 'earrings',
        image: 'https://example.com/category-image.jpg',
        parentCategory: null,
        subcategories: [
          {
            name: 'studs',
            image: 'https://example.com/subcategory-image.jpg',
            parentCategory: 'earrings',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  async findByName(@Param('name') name: string): Promise<any> {
    return this.categoryService.findByNameWithSubcategories(name);
  }

  @Patch(':name')
  @ApiOperation({ summary: 'Update category by name' })
  @ApiParam({ name: 'name', description: 'Category name' })
  @ApiResponse({
    status: 200,
    description: 'Category successfully updated',
    type: Category,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Category with the new name already exists',
  })
  async update(
    @Param('name') name: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoryService.update(name, updateCategoryDto);
  }

  @Delete(':name')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete category by name' })
  @ApiParam({ name: 'name', description: 'Category name' })
  @ApiResponse({
    status: 204,
    description: 'Category successfully deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  async remove(@Param('name') name: string): Promise<void> {
    await this.categoryService.remove(name);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete all categories' })
  @ApiResponse({
    status: 204,
    description: 'All categories successfully deleted',
  })
  async removeAll(): Promise<void> {
    await this.categoryService.removeAll();
  }
}
