import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductDocument } from './schema/product.schema';

// Додати тип для параметрів пагінації
interface FindAllProductsParams {
  limit?: number;
  page?: number;
}

interface ReviewPaginationResult {
  total: number;
  page: number;
  limit: number;
  reviews: any[];
}

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = new this.productModel(createProductDto);
    return product.save();
  }

  async findAll(params?: FindAllProductsParams): Promise<Product[]> {
    if (!params) {
      return this.productModel.find().exec();
    }
    const { limit, page } = params;
    const parsedLimit = limit ? Number(limit) : undefined;
    const parsedPage = page ? Number(page) : undefined;
    if (!parsedLimit || !parsedPage) {
      return this.productModel.find().exec();
    }
    const skip = (parsedPage - 1) * parsedLimit;
    return this.productModel.find().skip(skip).limit(parsedLimit).exec();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException(`Продукт з ID ${id} не знайдений`);
    }
    return product;
  }

  async findByCategory(category: string): Promise<Product[]> {
    const products = await this.productModel.find({ category }).exec();
    if (products.length === 0) {
      throw new NotFoundException(`В категорії "${category}" немає продуктів`);
    }
    return products;
  }

  async findByAction(action: string) {
    const products = await this.productModel
      .find({ action: { $regex: action, $options: 'i' } })
      .exec();
    if (!products || products.length === 0) {
      throw new NotFoundException(`Продукти з акцією "${action}" не знайдені`);
    }
    return products;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!updatedProduct) {
      throw new NotFoundException(`Продукт з ID ${id} не знайдений`);
    }

    return updatedProduct;
  }

  async remove(id: string): Promise<Product> {
    const deletedProduct = await this.productModel.findByIdAndDelete(id).exec();
    if (!deletedProduct) {
      throw new NotFoundException(`Продукт з ID ${id} не знайдений`);
    }
    return deletedProduct;
  }

  async paginateReviews(
    productId: string,
    page = 1,
    limit = 3,
  ): Promise<ReviewPaginationResult> {
    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new NotFoundException(`Продукт з ID ${productId} не знайдений`);
    }
    const total = product.reviews.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const reviews = product.reviews.slice(start, end);
    return { total, page, limit, reviews };
  }

  async addReview(productId: string, review: any): Promise<any> {
    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new NotFoundException(`Продукт з ID ${productId} не знайдений`);
    }
    product.reviews.unshift(review);
    await product.save();
    // Знаходимо щойно доданий відгук за _id (він буде першим у масиві)
    const savedReview = product.reviews[0];
    return savedReview;
  }

  /**
   * Прикріпити зображення до конкретного відгуку продукту
   */
  async attachImageToReview(
    productId: string,
    reviewId: string,
    imagePath: string,
  ): Promise<void> {
    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new NotFoundException(`Продукт з ID ${productId} не знайдений`);
    }
    const review = product.reviews.find(
      (r: any) => r._id?.toString() === reviewId,
    );
    if (!review) {
      throw new NotFoundException(
        `Відгук з ID ${reviewId} не знайдений у продукті ${productId}`,
      );
    }
    if (!Array.isArray(review.image)) {
      review.image = [];
    }
    review.image.push(imagePath);
    await product.save();
  }

  /**
   * Отримати всі унікальні категорії продуктів
   */
  async getAllCategories(): Promise<string[]> {
    return this.productModel.distinct('category').exec();
  }

  /**
   * Повертає всі продукти зі знижкою (discount > 0)
   */
  async findDiscounted(): Promise<Product[]> {
    return this.productModel.find({ discount: { $gt: 0 } }).exec();
  }
}
