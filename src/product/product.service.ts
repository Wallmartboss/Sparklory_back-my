import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cache } from 'cache-manager';
import { Model, Types } from 'mongoose';
import { CategoryService } from '../category/category.service';
import { EmailService } from '../email/email.service';
import { BulkProductQueryDto } from './dto/bulk-product-query.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { OptimizedProductQueryDto } from './dto/optimized-product-query.dto';
import {
  ProductCountsQueryDto,
  ProductCountsResponseDto,
} from './dto/product-counts.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  BulkProductResult,
  OptimizedProductResult,
} from './interfaces/optimized-product.interface';
import {
  ProductSubscription,
  ProductSubscriptionDocument,
} from './schema/product-subscription.schema';
import { Product, ProductDocument } from './schema/product.schema';

// Add type for pagination and filter parameters
interface FindAllProductsParams {
  limit?: number;
  page?: number;
  category?: string[];
  subcategory?: string[];
  material?: string[];
  insert?: string[];
  inStock?: number;
  minPrice?: number;
  maxPrice?: number;
  gender?: string[];
  collection?: string[];
  size?: string[];
  engraving?: boolean;
  action?: string[];
  hasDiscount?: boolean;
  search?: string;
  sort?: string;
  fields?: string[];
}

interface ReviewPaginationResult {
  total: number;
  page: number;
  limit: number;
  reviews: any[];
}

interface ProductPaginationResult {
  total: number;
  page: number;
  limit: number;
  pages: number;
  products: Product[];
}

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(ProductSubscription.name)
    private subscriptionModel: Model<ProductSubscriptionDocument>,
    private categoryService: CategoryService,
    private readonly emailService: EmailService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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
            'Дана підкатегорія відноситься до іншої категорії',
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

  async findAll(
    params?: FindAllProductsParams,
  ): Promise<ProductPaginationResult> {
    // Use the same filter logic as buildOptimizedFilter
    const filter = this.buildOptimizedFilter(
      params as OptimizedProductQueryDto,
    );
    const projection = this.buildProjection(params?.fields);
    const sortOption = this.buildSort(params?.sort);

    const limit = params?.limit ? Number(params.limit) : 16;
    const page = params?.page ? Number(params.page) : 1;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.productModel
        .find(filter, projection)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .populate('category', 'name _id')
        .populate('subcategory', 'name _id')
        .exec(),
      this.productModel.countDocuments(filter),
    ]);

    // Strip out-of-range variants if price bounds are provided
    if (
      (params?.minPrice !== undefined && params?.minPrice !== null) ||
      (params?.maxPrice !== undefined && params?.maxPrice !== null)
    ) {
      products.forEach((product: any) => {
        if (Array.isArray(product?.variants)) {
          const min =
            params?.minPrice !== undefined && params?.minPrice !== null
              ? Number(params.minPrice)
              : undefined;
          const max =
            params?.maxPrice !== undefined && params?.maxPrice !== null
              ? Number(params.maxPrice)
              : undefined;
          const filtered = product.variants.filter((v: any) => {
            if (v == null || typeof v.price !== 'number') {
              if (min == null && max == null) return true;
              return false;
            }
            if (min != null && v.price < min) return false;
            if (max != null && v.price > max) return false;
            return true;
          });
          // For mongoose docs and lean objects assignment both work
          product.variants = filtered;
        }
      });
    }
    const pages = Math.ceil(total / limit) || 1;
    return { total, page, limit, pages, products };
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
  async getCategoriesWithSubcategories(): Promise<{
    total: number;
    categories: any[];
  }> {
    const categories = await this.categoryService['categoryModel']
      .find()
      .lean();
    const categoryMap = {};
    categories.forEach(cat => {
      if (!cat.parentCategory) {
        categoryMap[cat.name] = { ...cat, subcategories: [] };
      }
    });
    categories.forEach(cat => {
      if (cat.parentCategory) {
        const parentName = cat.parentCategory;
        if (categoryMap[parentName]) {
          categoryMap[parentName].subcategories.push({
            _id: cat._id,
            name: cat.name,
            image: cat.image,
          });
        }
      }
    });
    const result = Object.values(categoryMap);
    return { total: result.length, categories: result };
  }

  /**
   * Get products with advanced caching and performance optimization
   * This method provides better performance for frequently accessed product data
   */
  async getProductsOptimized(
    query: OptimizedProductQueryDto,
  ): Promise<OptimizedProductResult> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(query);

    // Try to get from cache first
    if (query.useCache !== false) {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        return {
          ...(cached as OptimizedProductResult),
          executionTime: Date.now() - startTime,
          cacheHit: true,
        } as OptimizedProductResult;
      }
    }

    try {
      // Build filter and projection
      const filter = this.buildOptimizedFilter(query);
      const projection = this.buildProjection(query.fields);
      const sort = this.buildSort(query.sort);

      // Set pagination parameters
      const page = query.page || 1;
      const limit = query.limit || 20;
      const skip = (page - 1) * limit;

      // Execute query with optimization
      const [products, total] = await Promise.all([
        this.productModel
          .find(filter, projection)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        this.productModel.countDocuments(filter).exec(),
      ]);

      // Strip out-of-range variants if price bounds are provided
      if (
        (query.minPrice !== undefined && query.minPrice !== null) ||
        (query.maxPrice !== undefined && query.maxPrice !== null)
      ) {
        const min =
          query.minPrice !== undefined && query.minPrice !== null
            ? Number(query.minPrice)
            : undefined;
        const max =
          query.maxPrice !== undefined && query.maxPrice !== null
            ? Number(query.maxPrice)
            : undefined;
        products.forEach((product: any) => {
          if (Array.isArray(product?.variants)) {
            product.variants = product.variants.filter((v: any) => {
              if (v == null || typeof v.price !== 'number') {
                if (min == null && max == null) return true;
                return false;
              }
              if (min != null && v.price < min) return false;
              if (max != null && v.price > max) return false;
              return true;
            });
          }
        });
      }

      // Calculate pagination info
      const pages = Math.ceil(total / limit);
      const hasNext = page < pages;
      const hasPrev = page > 1;

      const result: OptimizedProductResult = {
        total,
        page,
        limit,
        pages,
        hasNext,
        hasPrev,
        executionTime: Date.now() - startTime,
        cacheHit: false,
        products,
      };

      // Cache the result
      if (query.useCache !== false) {
        await this.cacheManager.set(cacheKey, result, 1800); // 30 minutes TTL
      }

      return result;
    } catch (error) {
      console.error('Error in getProductsOptimized:', error);
      throw error;
    }
  }

  /**
   * Get multiple products by IDs with optimization
   */
  async getProductsBulk(
    query: BulkProductQueryDto,
  ): Promise<BulkProductResult> {
    const startTime = Date.now();
    const cacheKey = `bulk:${query.productIds.sort().join(',')}`;

    // Try to get from cache first
    if (query.useCache !== false) {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        return {
          ...(cached as BulkProductResult),
          executionTime: Date.now() - startTime,
          cacheHit: true,
        } as BulkProductResult;
      }
    }

    // Build projection
    const projection = this.buildProjection(query.fields);

    // Add conditional fields
    if (query.includeVariants !== false) {
      projection.variants = 1;
    }
    if (query.includeReviews === true) {
      projection.reviews = 1;
    }

    // Execute query
    const products = await this.productModel
      .find(
        { _id: { $in: query.productIds.map(id => new Types.ObjectId(id)) } },
        projection,
      )
      .lean()
      .exec();

    const found = products.length;
    const notFound = query.productIds.filter(
      id => !products.find(p => p._id.toString() === id),
    );

    // Limit reviews if specified
    if (query.includeReviews && query.maxReviews) {
      products.forEach(product => {
        if (product.reviews && product.reviews.length > query.maxReviews) {
          product.reviews = product.reviews.slice(0, query.maxReviews);
        }
      });
    }

    const result: BulkProductResult = {
      products,
      found,
      notFound,
      executionTime: Date.now() - startTime,
      cacheHit: false,
    };

    // Cache the result
    if (query.useCache !== false) {
      await this.cacheManager.set(cacheKey, result, 300); // 5 minutes TTL
    }

    return result;
  }

  /**
   * Search products using text index
   */
  async searchProducts(
    searchText: string,
    options: {
      limit?: number;
      page?: number;
      category?: string[];
      useCache?: boolean;
    } = {},
  ): Promise<OptimizedProductResult> {
    const startTime = Date.now();
    const cacheKey = `search:${searchText}:${JSON.stringify(options)}`;

    // Try to get from cache first
    if (options.useCache !== false) {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        return {
          ...(cached as OptimizedProductResult),
          executionTime: Date.now() - startTime,
          cacheHit: true,
        } as OptimizedProductResult;
      }
    }

    try {
      // Build filter - use regex search instead of text search for now
      const filter: any = {
        $or: [
          { name: { $regex: searchText, $options: 'i' } },
          { description: { $regex: searchText, $options: 'i' } },
          { category: { $regex: searchText, $options: 'i' } },
          { subcategory: { $regex: searchText, $options: 'i' } },
        ],
      };

      if (options.category && options.category.length > 0) {
        const normalizedCategories = options.category.map(category =>
          this.normalizeSearchTerm(category),
        );
        filter.category = {
          $in: normalizedCategories.map(
            category =>
              new RegExp(`^${this.escapeRegexString(category)}$`, 'i'),
          ),
        };
      }

      // Pagination
      const limit = options.limit || 20;
      const page = options.page || 1;
      const skip = (page - 1) * limit;

      // Execute search query
      const [products, total] = await Promise.all([
        this.productModel
          .find(filter)
          .sort({ name: 1 }) // Sort by name instead of text score
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        this.productModel.countDocuments(filter),
      ]);

      const pages = Math.ceil(total / limit) || 1;
      const result: OptimizedProductResult = {
        total,
        page,
        limit,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
        executionTime: Date.now() - startTime,
        cacheHit: false,
        products,
      };

      // Cache the result
      if (options.useCache !== false) {
        await this.cacheManager.set(cacheKey, result, 1800); // 30 minutes TTL
      }

      return result;
    } catch (error) {
      console.error('Error in searchProducts:', error);
      throw error;
    }
  }

  // Helper methods for optimization

  private generateCacheKey(query: OptimizedProductQueryDto): string {
    const keyParts = [
      'products:optimized',
      query.category || 'all',
      query.subcategory || 'all',
      query.material || 'all',
      query.insert || 'all',
      query.inStock || 'all',
      query.minPrice ?? 'all',
      query.maxPrice ?? 'all',
      query.gender || 'all',
      query.collection || 'all',
      query.size || 'all',
      query.engraving || 'all',
      query.action ? query.action.sort().join(',') : 'all',
      query.hasDiscount || 'all',
      query.search || 'all',
      query.sort || 'default',
      query.page || 1,
      query.limit || 20,
    ];
    return keyParts.join(':');
  }

  private buildOptimizedFilter(query: OptimizedProductQueryDto): any {
    const filter: any = {};

    // Validate price range
    if (
      query.minPrice !== undefined &&
      query.minPrice !== null &&
      query.maxPrice !== undefined &&
      query.maxPrice !== null &&
      Number(query.minPrice) > Number(query.maxPrice)
    ) {
      throw new BadRequestException('minPrice must be less than maxPrice');
    }

    // Helper for null/empty filter
    function buildNullOrValuesFilter(
      field: string,
      values: string[],
      isVariant = false,
    ) {
      const hasNull = values.some(v => v === null || v === 'null');
      const notNullValues = values.filter(v => v !== null && v !== 'null');
      const regexValues = notNullValues.map(
        v =>
          new RegExp(
            `^${this.escapeRegexString(this.normalizeSearchTerm(v))}$`,
            'i',
          ),
      );
      const fieldName = isVariant ? `variants.${field}` : field;
      // Для action, subcategory, category, insert, prod_collection, size добавляем строгую фильтрацию по отсутствию/пустоте
      // Только для массивов: action
      const arrayFields = ['action'];
      const strictNullFields = [
        'action',
        'subcategory',
        'category',
        'insert',
        'prod_collection',
        'size',
      ];
      if (strictNullFields.includes(field) && hasNull) {
        const baseOr = {
          $or: [
            { [fieldName]: { $exists: false } },
            { [fieldName]: null },
            { [fieldName]: '' },
            { [fieldName]: [] },
          ],
        };
        if (arrayFields.includes(field)) {
          // Только для action добавляем $not/$elemMatch
          return {
            ...baseOr,
            [fieldName]: { $not: { $elemMatch: { $exists: true } } },
          };
        } else {
          // Для строк — только $or
          return baseOr;
        }
      }
      // Для остальных полей
      if (hasNull && regexValues.length > 0) {
        return {
          $or: [
            { [fieldName]: { $in: regexValues } },
            { [fieldName]: { $exists: false } },
            { [fieldName]: null },
            { [fieldName]: '' },
          ],
        };
      } else if (hasNull) {
        return {
          $or: [
            { [fieldName]: { $exists: false } },
            { [fieldName]: null },
            { [fieldName]: '' },
          ],
        };
      } else if (regexValues.length > 0) {
        return {
          [fieldName]: { $in: regexValues },
        };
      } else {
        return {};
      }
    }

    // Only add filters if they are provided
    if (query.category && query.category.length > 0) {
      Object.assign(
        filter,
        buildNullOrValuesFilter.call(this, 'category', query.category),
      );
    }
    if (query.subcategory && query.subcategory.length > 0) {
      Object.assign(
        filter,
        buildNullOrValuesFilter.call(this, 'subcategory', query.subcategory),
      );
    }
    if (query.material && query.material.length > 0) {
      Object.assign(
        filter,
        buildNullOrValuesFilter.call(this, 'material', query.material, true),
      );
    }
    if (query.insert && query.insert.length > 0) {
      Object.assign(
        filter,
        buildNullOrValuesFilter.call(this, 'insert', query.insert, true),
      );
    }
    if (query.gender && query.gender.length > 0) {
      Object.assign(
        filter,
        buildNullOrValuesFilter.call(this, 'gender', query.gender),
      );
    }
    if (query.collection && query.collection.length > 0) {
      Object.assign(
        filter,
        buildNullOrValuesFilter.call(this, 'prod_collection', query.collection),
      );
    }
    if (query.size && query.size.length > 0) {
      Object.assign(
        filter,
        buildNullOrValuesFilter.call(this, 'size', query.size, true),
      );
    }
    if (query.action && query.action.length > 0) {
      Object.assign(
        filter,
        buildNullOrValuesFilter.call(this, 'action', query.action),
      );
    }

    if (query.inStock !== undefined && query.inStock !== null) {
      filter['variants.inStock'] = { $gte: Number(query.inStock) };
    }
    if (query.engraving !== undefined && query.engraving !== null) {
      filter.engraving = query.engraving;
    }
    if (
      (query.minPrice !== undefined && query.minPrice !== null) ||
      (query.maxPrice !== undefined && query.maxPrice !== null)
    ) {
      const priceCond: any = {};
      if (query.minPrice !== undefined && query.minPrice !== null) {
        priceCond.$gte = Number(query.minPrice);
      }
      if (query.maxPrice !== undefined && query.maxPrice !== null) {
        priceCond.$lte = Number(query.maxPrice);
      }
      filter['variants.price'] = priceCond;
    }
    if (query.hasDiscount === true) {
      filter.$or = [
        { discount: { $gt: 0 } },
        {
          $and: [
            { discountStart: { $lte: new Date() } },
            { discountEnd: { $gte: new Date() } },
          ],
        },
      ];
    }
    if (query.search && query.search.trim()) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
        { category: { $regex: query.search, $options: 'i' } },
        { subcategory: { $regex: query.search, $options: 'i' } },
      ];
    }
    return filter;
  }

  private buildProjection(fields?: string[]): any {
    if (!fields || fields.length === 0) {
      return {}; // Return all fields
    }

    const projection: any = { _id: 1 };
    fields.forEach(field => {
      projection[field] = 1;
    });

    return projection;
  }

  private buildSort(sort?: string): any {
    const sortOption: any = {};

    if (sort) {
      switch (sort) {
        case 'price_asc':
          sortOption['variants.price'] = 1;
          break;
        case 'price_desc':
          sortOption['variants.price'] = -1;
          break;
        case 'name_asc':
          sortOption.name = 1;
          break;
        case 'name_desc':
          sortOption.name = -1;
          break;
        case 'discount_asc':
          sortOption.discount = 1;
          break;
        case 'discount_desc':
          sortOption.discount = -1;
          break;
        case 'created_asc':
          sortOption._id = 1; // Older first assuming lower ObjectIds are older
          break;
        case 'created_desc':
          sortOption._id = -1; // Assuming newer documents have higher ObjectIds
          break;
        default:
          sortOption._id = -1; // Default sort by newest
      }
    } else {
      sortOption._id = -1; // Default sort by newest
    }

    return sortOption;
  }

  /**
   * Get product counts grouped by different parameters
   * Returns counts for category, subcategory, material, insert, size, and engraving
   * Counts unique products, not variants - if a product has multiple variants with the same parameter, it counts as 1
   */
  async getProductCounts(
    query: ProductCountsQueryDto = {},
  ): Promise<ProductCountsResponseDto> {
    const startTime = Date.now();
    const cacheKey = `product-counts:${JSON.stringify(query)}`;

    // Try to get from cache first
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return {
        ...(cached as ProductCountsResponseDto),
        executionTime: Date.now() - startTime,
        cacheHit: true,
      } as ProductCountsResponseDto & {
        executionTime: number;
        cacheHit: boolean;
      };
    }

    try {
      // Validate price range if both provided
      if (
        query.minPrice !== undefined &&
        query.minPrice !== null &&
        query.maxPrice !== undefined &&
        query.maxPrice !== null &&
        Number(query.minPrice) > Number(query.maxPrice)
      ) {
        throw new BadRequestException(
          'minPrice must be less than or equal to maxPrice',
        );
      }
      // Build base filter from query parameters
      const filter: any = {};

      if (query.category) {
        const normalizedCategory = this.normalizeSearchTerm(query.category);
        filter.category = {
          $regex: new RegExp(
            `^${this.escapeRegexString(normalizedCategory)}$`,
            'i',
          ),
        };
      }

      if (query.subcategory) {
        const normalizedSubcategory = this.normalizeSearchTerm(
          query.subcategory,
        );
        filter.subcategory = {
          $regex: new RegExp(
            `^${this.escapeRegexString(normalizedSubcategory)}$`,
            'i',
          ),
        };
      }

      if (query.material) {
        const normalizedMaterial = this.normalizeSearchTerm(query.material);
        filter['variants.material'] = {
          $regex: new RegExp(
            `^${this.escapeRegexString(normalizedMaterial)}$`,
            'i',
          ),
        };
      }

      if (query.insert) {
        const normalizedInsert = this.normalizeSearchTerm(query.insert);
        filter['variants.insert'] = {
          $regex: new RegExp(
            `^${this.escapeRegexString(normalizedInsert)}$`,
            'i',
          ),
        };
      }

      if (query.size) {
        const normalizedSize = this.normalizeSearchTerm(query.size);
        filter['variants.size'] = {
          $regex: new RegExp(
            `^${this.escapeRegexString(normalizedSize)}$`,
            'i',
          ),
        };
      }

      if (query.engraving !== undefined) {
        filter.engraving = query.engraving;
      }

      if (query.gender) {
        const normalizedGender = this.normalizeSearchTerm(query.gender);
        filter.gender = {
          $regex: new RegExp(
            `^${this.escapeRegexString(normalizedGender)}$`,
            'i',
          ),
        };
      }

      if (query.action && query.action.length > 0) {
        const actions = query.action
          .filter(action => action && action.trim())
          .map(action => action.trim());

        if (actions.length > 0) {
          // Since action is an array field, we need to check if any of the actions
          // are contained in the product's action array (case-insensitive)
          filter.action = {
            $in: actions.map(
              action => new RegExp(`^${this.escapeRegexString(action)}$`, 'i'),
            ),
          };
        }
      }

      if (query.prod_collection) {
        const normalizedCollection = this.normalizeSearchTerm(
          query.prod_collection,
        );
        filter.prod_collection = {
          $regex: new RegExp(
            `^${this.escapeRegexString(normalizedCollection)}$`,
            'i',
          ),
        };
      }

      // Prepare price condition and a base filter without price for price range facet
      const priceCond: any = {};
      const hasPriceBounds =
        (query.minPrice !== undefined && query.minPrice !== null) ||
        (query.maxPrice !== undefined && query.maxPrice !== null);
      if (hasPriceBounds) {
        if (query.minPrice !== undefined && query.minPrice !== null) {
          priceCond.$gte = Number(query.minPrice);
        }
        if (query.maxPrice !== undefined && query.maxPrice !== null) {
          priceCond.$lte = Number(query.maxPrice);
        }
      }

      const baseFilterWithoutPrice = { ...filter };
      if (hasPriceBounds) {
        filter['variants.price'] = priceCond;
      }

      // Execute aggregation pipeline to get counts and price range
      const pipeline: any[] = [
        { $match: baseFilterWithoutPrice },
        {
          $facet: {
            // Count by category
            category: [
              ...(hasPriceBounds
                ? [
                    {
                      $match: { 'variants.price': priceCond },
                    },
                  ]
                : []),
              { $group: { _id: '$category', count: { $sum: 1 } } },
              { $sort: { _id: 1 } },
            ],
            // Count by subcategory
            subcategory: [
              ...(hasPriceBounds
                ? [
                    {
                      $match: { 'variants.price': priceCond },
                    },
                  ]
                : []),
              { $match: { subcategory: { $exists: true, $ne: null } } },
              { $group: { _id: '$subcategory', count: { $sum: 1 } } },
              { $sort: { _id: 1 } },
            ],
            // Count by material from variants - count unique products
            material: [
              {
                $unwind: {
                  path: '$variants',
                  preserveNullAndEmptyArrays: true,
                },
              },
              ...(hasPriceBounds
                ? [
                    {
                      $match: { 'variants.price': priceCond },
                    },
                  ]
                : []),
              { $match: { 'variants.material': { $exists: true, $ne: null } } },
              {
                $group: {
                  _id: {
                    productId: '$_id',
                    material: '$variants.material',
                  },
                },
              },
              { $group: { _id: '$_id.material', count: { $sum: 1 } } },
              { $sort: { _id: 1 } },
            ],
            // Count by insert from variants - count unique products
            insert: [
              {
                $unwind: {
                  path: '$variants',
                  preserveNullAndEmptyArrays: true,
                },
              },
              ...(hasPriceBounds
                ? [
                    {
                      $match: { 'variants.price': priceCond },
                    },
                  ]
                : []),
              { $match: { 'variants.insert': { $exists: true, $ne: null } } },
              {
                $group: {
                  _id: {
                    productId: '$_id',
                    insert: '$variants.insert',
                  },
                },
              },
              { $group: { _id: '$_id.insert', count: { $sum: 1 } } },
              { $sort: { _id: 1 } },
            ],
            // Count by size from variants - count unique products
            size: [
              {
                $unwind: {
                  path: '$variants',
                  preserveNullAndEmptyArrays: true,
                },
              },
              ...(hasPriceBounds
                ? [
                    {
                      $match: { 'variants.price': priceCond },
                    },
                  ]
                : []),
              { $match: { 'variants.size': { $exists: true, $ne: null } } },
              {
                $group: {
                  _id: {
                    productId: '$_id',
                    size: '$variants.size',
                  },
                },
              },
              { $group: { _id: '$_id.size', count: { $sum: 1 } } },
              { $sort: { _id: 1 } },
            ],
            // Count by engraving
            engraving: [
              ...(hasPriceBounds
                ? [
                    {
                      $match: { 'variants.price': priceCond },
                    },
                  ]
                : []),
              { $group: { _id: '$engraving', count: { $sum: 1 } } },
              { $sort: { _id: 1 } },
            ],
            // Count by gender
            gender: [
              ...(hasPriceBounds
                ? [
                    {
                      $match: { 'variants.price': priceCond },
                    },
                  ]
                : []),
              { $match: { gender: { $exists: true, $ne: null } } },
              { $group: { _id: '$gender', count: { $sum: 1 } } },
              { $sort: { _id: 1 } },
            ],
            // Count by action
            action: [
              ...(hasPriceBounds
                ? [
                    {
                      $match: { 'variants.price': priceCond },
                    },
                  ]
                : []),
              { $match: { action: { $exists: true, $ne: null } } },
              { $group: { _id: '$action', count: { $sum: 1 } } },
              { $sort: { _id: 1 } },
            ],
            // Count by prod_collection
            prod_collection: [
              ...(hasPriceBounds
                ? [
                    {
                      $match: { 'variants.price': priceCond },
                    },
                  ]
                : []),
              { $match: { prod_collection: { $exists: true, $ne: null } } },
              { $group: { _id: '$prod_collection', count: { $sum: 1 } } },
              { $sort: { _id: 1 } },
            ],
            // Total count
            total: [
              ...(hasPriceBounds
                ? [
                    {
                      $match: { 'variants.price': priceCond },
                    },
                  ]
                : []),
              { $count: 'total' },
            ],
            // Price range across matching products ignoring requested price bounds
            price: [
              {
                $unwind: {
                  path: '$variants',
                  preserveNullAndEmptyArrays: false,
                },
              },
              { $match: { 'variants.price': { $type: 'number' } } },
              {
                $group: {
                  _id: null,
                  min: { $min: '$variants.price' },
                  max: { $max: '$variants.price' },
                },
              },
            ],
          },
        },
      ];

      const [result] = await this.productModel.aggregate(pipeline);

      // Transform the results into the expected format with normalization
      const response: ProductCountsResponseDto = {
        category: this.transformCounts(result.category),
        subcategory: this.normalizeAndTransformCounts(result.subcategory),
        material: this.normalizeAndTransformCounts(result.material),
        insert: this.normalizeAndTransformCounts(result.insert),
        size: this.transformCounts(result.size),
        action: this.transformCounts(result.action),
        prod_collection: this.transformCounts(result.prod_collection),
        engraving: {
          true: result.engraving.find(item => item._id === true)?.count || 0,
          false: result.engraving.find(item => item._id === false)?.count || 0,
        },
        gender: this.transformCounts(result.gender),
        total: result.total[0]?.total || 0,
        price: {
          min: result.price[0]?.min ?? 0,
          max: result.price[0]?.max ?? 0,
        },
      };

      // Cache the result for 30 minutes
      await this.cacheManager.set(cacheKey, response, 1800);

      return response;
    } catch (error) {
      console.error('Error in getProductCounts:', error);
      throw error;
    }
  }

  /**
   * Transform aggregation results into a simple key-value object
   */
  private transformCounts(
    counts: Array<{ _id: string; count: number }>,
  ): Record<string, number> {
    return counts.reduce(
      (acc, item) => {
        acc[item._id] = item.count;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  /**
   * Normalize and transform counts, combining similar values (case-insensitive, language variants)
   */
  private normalizeAndTransformCounts(
    counts: Array<{ _id: string; count: number }>,
  ): Record<string, number> {
    const normalized: Record<string, number> = {};

    // Define normalization rules for common variations
    const normalizationRules: Record<string, string> = {
      // Materials
      срібло: 'Silver',
      золото: 'Gold',
      'біле золото': 'White Gold',
      платина: 'Platinum',
      platina: 'Platinum',
      lether: 'Leather',

      // Inserts
      diamond: 'Diamond',
      pearl: 'Pearl',
      pearls: 'Pearl',
      perl: 'Pearl',
      sapphire: 'Sapphire',
      emerald: 'Emerald',
      ruby: 'Ruby',
      amethyst: 'Amethyst',
      opal: 'Opal',
      onyx: 'Onyx',
      topaz: 'Topaz',
      moonstone: 'Moonstone',
      crystal: 'Crystal',
      zirconia: 'Zirconia',
      'cubic zirconia': 'Cubic Zirconia',
      enamel: 'Enamel',
      silver: 'Silver',
      gold: 'Gold',
      'white gold': 'White Gold',

      // Subcategories
      'drop earrings': 'Drop Earrings',
      'hoop earrings': 'Hoop Earrings',
      'long earrings': 'Long Earrings',
      'wide rings': 'Wide Rings',
      'wedding ring': 'Wedding Ring',
      'ear cuffs': 'Ear Cuffs',
      studs: 'Studs',
      stud: 'Studs',
      threader: 'Threader',
    };

    counts.forEach(item => {
      const originalValue = item._id;
      const normalizedValue = this.normalizeValue(
        originalValue,
        normalizationRules,
      );

      if (normalized[normalizedValue]) {
        normalized[normalizedValue] += item.count;
      } else {
        normalized[normalizedValue] = item.count;
      }
    });

    return normalized;
  }

  /**
   * Normalize a single value using the normalization rules
   */
  private normalizeValue(value: string, rules: Record<string, string>): string {
    if (!value) return value;

    // First check exact match in rules
    const lowerValue = value.toLowerCase().trim();
    if (rules[lowerValue]) {
      return rules[lowerValue];
    }

    // Check if any rule key is contained in the value (for compound values)
    for (const [ruleKey, ruleValue] of Object.entries(rules)) {
      if (lowerValue.includes(ruleKey.toLowerCase())) {
        return ruleValue;
      }
    }

    // If no rule matches, return the original value with proper capitalization
    return this.capitalizeFirstLetter(value.trim());
  }

  /**
   * Capitalize the first letter of a string
   */
  private capitalizeFirstLetter(str: string): string {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * Escape special regex characters in a string
   */
  private escapeRegexString(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Normalize a search term for consistent filtering across all endpoints
   * Converts to lowercase and applies normalization rules
   */
  private normalizeSearchTerm(term: string): string {
    if (!term) return term;

    const trimmedTerm = term.trim().toLowerCase();

    // Define normalization rules for search terms (convert to lowercase)
    const searchNormalizationRules: Record<string, string> = {
      // Materials
      срібло: 'silver',
      золото: 'gold',
      'біле золото': 'white gold',
      платина: 'platinum',
      platina: 'platinum',
      lether: 'leather',

      // Inserts
      diamond: 'diamond',
      pearl: 'pearl',
      pearls: 'pearl',
      perl: 'pearl',
      sapphire: 'sapphire',
      emerald: 'emerald',
      ruby: 'ruby',
      amethyst: 'amethyst',
      opal: 'opal',
      onyx: 'onyx',
      topaz: 'topaz',
      moonstone: 'moonstone',
      crystal: 'crystal',
      zirconia: 'zirconia',
      'cubic zirconia': 'cubic zirconia',
      enamel: 'enamel',
      silver: 'silver',
      gold: 'gold',
      'white gold': 'white gold',

      // Subcategories
      'drop earrings': 'drop earrings',
      'hoop earrings': 'hoop earrings',
      'long earrings': 'long earrings',
      'wide rings': 'wide rings',
      'wedding ring': 'wedding ring',
      'ear cuffs': 'ear cuffs',
      studs: 'studs',
      stud: 'studs',
      threader: 'threader',
    };

    // Check if we have a normalization rule for this term
    if (searchNormalizationRules[trimmedTerm]) {
      return searchNormalizationRules[trimmedTerm];
    }

    // Check for partial matches (for compound values)
    for (const [ruleKey, ruleValue] of Object.entries(
      searchNormalizationRules,
    )) {
      if (trimmedTerm.includes(ruleKey)) {
        return ruleValue;
      }
    }

    // Return the original term in lowercase
    return trimmedTerm;
  }

  /**
   * Clear all product-related cache entries
   * This method helps maintain cache consistency when products are updated
   */
  async clearProductCache(): Promise<string[]> {
    const clearedKeys: string[] = [];

    if (!this.cacheManager) {
      return clearedKeys;
    }

    try {
      // Get all cache keys (this is a simplified approach)
      // In a production environment, you might want to use a more sophisticated cache key management system
      const cachePatterns = [
        'products:compare:*',
        'products:optimized:*',
        'product-counts:*',
      ];

      // Clear cache entries matching patterns
      for (const pattern of cachePatterns) {
        try {
          // Note: This is a simplified cache clearing approach
          // In a real implementation, you might need to iterate through all cache keys
          await this.cacheManager.del(pattern);
          clearedKeys.push(pattern);
        } catch (error) {
          console.warn(
            `Failed to clear cache pattern ${pattern}:`,
            (error as Error).message,
          );
          // Continue with other patterns even if one fails
        }
      }

      return clearedKeys;
    } catch (error) {
      console.error('Cache clear error:', (error as Error).message);
      throw new Error(
        `Failed to clear product cache: ${(error as Error).message}`,
      );
    }
  }
}
