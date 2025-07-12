import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Check if a category with the same name already exists
    const existingCategory = await this.categoryModel
      .findOne({
        name: createCategoryDto.name,
      })
      .exec();

    if (existingCategory) {
      throw new ConflictException(
        `Category with name "${createCategoryDto.name}" already exists`,
      );
    }

    const category = new this.categoryModel(createCategoryDto);
    return category.save();
  }

  async findAll(): Promise<Category[]> {
    return this.categoryModel.find().exec();
  }

  async findByName(name: string): Promise<Category> {
    const category = await this.categoryModel.findOne({ name }).exec();
    if (!category) {
      throw new NotFoundException(`Category with name "${name}" not found`);
    }
    return category;
  }

  async update(
    name: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    // If updating the name, check that the new name is not already taken
    if (updateCategoryDto.name && updateCategoryDto.name !== name) {
      const existingCategory = await this.categoryModel
        .findOne({
          name: updateCategoryDto.name,
        })
        .exec();

      if (existingCategory) {
        throw new ConflictException(
          `Category with name "${updateCategoryDto.name}" already exists`,
        );
      }
    }

    const updatedCategory = await this.categoryModel
      .findOneAndUpdate({ name }, updateCategoryDto, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!updatedCategory) {
      throw new NotFoundException(`Category with name "${name}" not found`);
    }

    return updatedCategory;
  }

  async remove(name: string): Promise<Category> {
    const deletedCategory = await this.categoryModel
      .findOneAndDelete({ name })
      .exec();
    if (!deletedCategory) {
      throw new NotFoundException(`Category with name "${name}" not found`);
    }
    return deletedCategory;
  }

  async removeAll(): Promise<{ deletedCount: number }> {
    const result = await this.categoryModel.deleteMany({}).exec();
    return { deletedCount: result.deletedCount };
  }

  async exists(name: string): Promise<boolean> {
    const category = await this.categoryModel.findOne({ name }).exec();
    return !!category;
  }
}
