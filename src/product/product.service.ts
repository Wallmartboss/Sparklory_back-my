import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CategoryService } from '../category/category.service';
import { EmailService } from '../email/email.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  ProductSubscription,
  ProductSubscriptionDocument,
} from './schema/product-subscription.schema';
import { Product, ProductDocument } from './schema/product.schema';

// Add type for pagination parameters
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
    @InjectModel(ProductSubscription.name)
    private subscriptionModel: Model<ProductSubscriptionDocument>,
    private categoryService: CategoryService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Create a new product. If the category or subcategory does not exist, they will be created automatically.
   * If the subcategory exists but belongs to another category, an error will be thrown.
   */
  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Normalize category and subcategory to lowercase for comparison
    const categoryName = createProductDto.category.toLowerCase();
    const subcategoryName = createProductDto.subcategory
      ? createProductDto.subcategory.toLowerCase()
      : undefined;
    // Ensure category exists or create it
    let category = await this.categoryService['categoryModel'].findOne({
      name: categoryName,
    });
    if (!category) {
      category = await this.categoryService['categoryModel'].create({
        name: categoryName,
        parentCategory: null,
      });
    }
    // Ensure subcategory exists and is linked to the correct category
    if (subcategoryName) {
      const subcategory = await this.categoryService['categoryModel'].findOne({
        name: subcategoryName,
      });
      if (subcategory) {
        if (subcategory.parentCategory !== categoryName) {
          throw new BadRequestException(
            'Данная подкатегория относится к другой категории',
          );
        }
      } else {
        await this.categoryService['categoryModel'].create({
          name: subcategoryName,
          parentCategory: categoryName,
        });
      }
    }
    const product = new this.productModel({
      ...createProductDto,
      category: categoryName,
      subcategory: subcategoryName,
    });
    return product.save();
  }

  async findAll(params?: FindAllProductsParams): Promise<Product[]> {
    if (!params) {
      return this.productModel
        .find()
        .populate('category', 'name _id')
        .populate('subcategory', 'name _id')
        .exec();
    }
    const { limit, page } = params;
    const parsedLimit = limit ? Number(limit) : undefined;
    const parsedPage = page ? Number(page) : undefined;
    if (!parsedLimit || !parsedPage) {
      return this.productModel
        .find()
        .populate('category', 'name _id')
        .populate('subcategory', 'name _id')
        .exec();
    }
    const skip = (parsedPage - 1) * parsedLimit;
    return this.productModel
      .find()
      .skip(skip)
      .limit(parsedLimit)
      .populate('category', 'name _id')
      .populate('subcategory', 'name _id')
      .exec();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productModel
      .findById(id)
      .populate('category', 'name _id')
      .populate('subcategory', 'name _id')
      .exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async findByCategory(category: string): Promise<Product[]> {
    const products = await this.productModel
      .find({ category })
      .populate('category', 'name _id')
      .populate('subcategory', 'name _id')
      .exec();
    if (products.length === 0) {
      throw new NotFoundException(
        `No products found in category "${category}"`,
      );
    }
    return products;
  }

  async findByAction(action: string) {
    const products = await this.productModel
      .find({ action: { $regex: action, $options: 'i' } })
      .exec();
    if (!products || products.length === 0) {
      throw new NotFoundException(`No products found with action "${action}"`);
    }
    return products;
  }

  /**
   * Update a product. If the category or subcategory does not exist, they will be created automatically.
   * If the subcategory exists but belongs to another category, an error will be thrown.
   */
  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    // Normalize category and subcategory to lowercase for comparison
    const categoryName = updateProductDto.category
      ? updateProductDto.category.toLowerCase()
      : undefined;
    const subcategoryName = updateProductDto.subcategory
      ? updateProductDto.subcategory.toLowerCase()
      : undefined;
    // Ensure category exists or create it
    if (categoryName) {
      let category = await this.categoryService['categoryModel'].findOne({
        name: categoryName,
      });
      if (!category) {
        category = await this.categoryService['categoryModel'].create({
          name: categoryName,
          parentCategory: null,
        });
      }
    }
    // Ensure subcategory exists and is linked to the correct category
    if (subcategoryName) {
      const subcategory = await this.categoryService['categoryModel'].findOne({
        name: subcategoryName,
      });
      if (subcategory) {
        if (subcategory.parentCategory !== categoryName) {
          throw new BadRequestException(
            'Данная подкатегория относится к другой категории',
          );
        }
      } else {
        await this.categoryService['categoryModel'].create({
          name: subcategoryName,
          parentCategory: categoryName,
        });
      }
    }
    const updatedProduct = await this.productModel
      .findByIdAndUpdate(
        id,
        {
          ...updateProductDto,
          category: categoryName,
          subcategory: subcategoryName,
        },
        {
          new: true,
          runValidators: true,
        },
      )
      .exec();
    if (!updatedProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return updatedProduct;
  }

  async updateProductStock(productId: string, newStock: number) {
    const product = await this.productModel.findById(productId);
    if (!product) return null;
    // Check if all variants were out of stock before update
    const wasOutOfStock = product.variants.every(v => (v.inStock ?? 0) <= 0);
    // Update stock for the first variant (example)
    if (product.variants && product.variants.length > 0) {
      product.variants[0].inStock = newStock;
    }
    await product.save();
    // If it was out of stock and now is in stock — notify subscribers
    const isNowInStock = product.variants.some(v => (v.inStock ?? 0) > 0);
    if (wasOutOfStock && isNowInStock) {
      await this.notifySubscribers(productId, (email, prod) =>
        this.emailService.sendProductInStock(email, prod),
      );
    }
    return product;
  }

  async remove(id: string): Promise<Product> {
    const deletedProduct = await this.productModel.findByIdAndDelete(id).exec();
    if (!deletedProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
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
      throw new NotFoundException(`Product with ID ${productId} not found`);
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
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }
    product.reviews.unshift(review);
    await product.save();
    // Find the newly added review by _id (it will be the first in the array)
    const savedReview = product.reviews[0];
    return savedReview;
  }

  /**
   * Attach an image to a specific product review
   */
  async attachImageToReview(
    productId: string,
    reviewId: string,
    imagePath: string,
  ): Promise<void> {
    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }
    const review = product.reviews.find(
      (r: any) => r._id?.toString() === reviewId,
    );
    if (!review) {
      throw new NotFoundException(
        `Review with ID ${reviewId} not found in product ${productId}`,
      );
    }
    if (!Array.isArray(review.image)) {
      review.image = [];
    }
    review.image.push(imagePath);
    await product.save();
  }

  /**
   * Get all unique product categories
   */
  async getAllCategories(): Promise<string[]> {
    const ids = await this.productModel.distinct('category').exec();
    return ids.map(id => id.toString());
  }

  /**
   * Get all products with a discount (discount > 0)
   */
  async findDiscounted(): Promise<Product[]> {
    return this.productModel.find({ discount: { $gt: 0 } }).exec();
  }

  /**
   * Creates a subscription for product back-in-stock notification
   * If userId is provided, saves it in the subscription
   */
  async createSubscription(productId: string, email: string, userId?: string) {
    // Check for existing active subscription
    const query: any = {
      productId: new Types.ObjectId(productId),
      email,
      notified: false,
    };
    if (userId) query.userId = new Types.ObjectId(userId);
    const existing = await this.subscriptionModel.findOne(query);
    if (existing) {
      return { message: 'Already subscribed' };
    }
    const subData: any = {
      productId: new Types.ObjectId(productId),
      email,
      notified: false,
    };
    if (userId) subData.userId = new Types.ObjectId(userId);
    await this.subscriptionModel.create(subData);
    const product = await this.productModel.findById(productId);
    if (product) {
      try {
        await this.emailService.sendSubscriptionCreated(email, product);
      } catch (err) {
        // Optionally log error if needed
      }
    }
    return { message: 'Subscription created' };
  }

  /**
   * Notifies all subscribers when product is back in stock
   */
  async notifySubscribers(
    productId: string,
    sendEmail: (email: string, product: Product) => Promise<void>,
  ) {
    const product = await this.productModel.findById(productId);
    if (!product) return;
    const subs = await this.subscriptionModel.find({
      productId: new Types.ObjectId(productId),
      notified: false,
    });
    for (const sub of subs) {
      await sendEmail(sub.email, product);
      sub.notified = true;
      await sub.save();
    }
    return { notified: subs.length };
  }

  /**
   * Returns all product subscriptions
   */
  async getAllSubscriptions() {
    return this.subscriptionModel.find().lean();
  }

  /**
   * Find up to 3 products by their IDs for comparison
   */
  async findProductsByIds(productIds: string[]): Promise<Product[]> {
    if (
      !Array.isArray(productIds) ||
      productIds.length === 0 ||
      productIds.length > 3
    ) {
      throw new BadRequestException('You must provide 1 to 3 product IDs.');
    }
    // Convert to ObjectId
    const ids = productIds.map(id => new Types.ObjectId(id));
    return this.productModel.find({ _id: { $in: ids } }).exec();
  }

  /**
   * Get all product subscriptions for a specific email
   */
  async getSubscriptionsByEmail(email: string) {
    return this.subscriptionModel.find({ email }).lean();
  }

  /**
   * Get all product subscriptions for a specific user
   */
  async getSubscriptionsByUser(userId: string) {
    return this.subscriptionModel
      .find({ userId: new Types.ObjectId(userId) })
      .lean();
  }

  /**
   * Unsubscribe (delete subscription) by subscription ID
   */
  async unsubscribe(id: string) {
    const result = await this.subscriptionModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('Subscription not found');
    }
    return { message: 'Unsubscribed successfully' };
  }

  /**
   * Unsubscribe (delete subscription) by subscription ID and userId
   */
  async unsubscribeByUser(id: string, userId: string) {
    const result = await this.subscriptionModel.findOneAndDelete({
      _id: id,
      userId: new Types.ObjectId(userId),
    });
    if (!result) {
      throw new NotFoundException('Subscription not found');
    }
    return { message: 'Unsubscribed successfully' };
  }

  /**
   * Get all categories with their subcategories and image
   */
  async getCategoriesWithSubcategories() {
    // Получаем все категории
    const categories = await this.categoryService['categoryModel']
      .find()
      .lean();
    // Группируем подкатегории по parentCategory
    const categoryMap = {};
    categories.forEach(cat => {
      if (!cat.parentCategory) {
        categoryMap[cat._id.toString()] = { ...cat, subcategories: [] };
      }
    });
    categories.forEach(cat => {
      if (cat.parentCategory) {
        const parentId = cat.parentCategory.toString();
        if (categoryMap[parentId]) {
          categoryMap[parentId].subcategories.push({
            _id: cat._id,
            name: cat.name,
            image: cat.image,
          });
        }
      }
    });
    // Возвращаем массив категорий с подкатегориями
    return Object.values(categoryMap);
  }
}
