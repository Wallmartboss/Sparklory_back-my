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
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Category } from './category.schema';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Сategories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new category' })
  @ApiResponse({
    status: 201,
    description: 'Category successfully created',
    type: Category,
  })
  @ApiResponse({
    status: 409,
    description: 'Category with this name already exists',
  })
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({
    status: 200,
    description: 'List of all categories',
    type: [Category],
  })
  async findAll(): Promise<Category[]> {
    return this.categoryService.findAll();
  }

  @Get(':name')
  @ApiOperation({ summary: 'Get category by name' })
  @ApiParam({ name: 'name', description: 'Category name' })
  @ApiResponse({
    status: 200,
    description: 'Category found',
    type: Category,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  async findByName(@Param('name') name: string): Promise<Category> {
    return this.categoryService.findByName(name);
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
