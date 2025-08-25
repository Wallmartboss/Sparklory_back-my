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
  category?: string;
  material?: string;
  insert?: string;
  inStock?: number;
  sort?: string;
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

interface CategoryPaginationResult {
  total: number;
  page: number;
  limit: number;
  pages: number;
  categories: any[];
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
    const filter: any = {};
    if (params?.category) {
      filter.category = { $regex: `^${params.category}$`, $options: 'i' };
    }
    if (params?.material) {
      filter['variants.material'] = {
        $regex: `^${params.material}$`,
        $options: 'i',
      };
    }
    if (params?.insert) {
      filter['variants.insert'] = {
        $regex: `^${params.insert}$`,
        $options: 'i',
      };
    }
    if (params?.inStock !== undefined) {
      filter['variants.inStock'] = { $gte: Number(params.inStock) };
    }
    const sortOption: any = {};
    if (params?.sort) {
      if (params.sort === 'price_desc') {
        sortOption['variants.price'] = -1;
      } else if (params.sort === 'price_asc') {
        sortOption['variants.price'] = 1;
      }
    }
    const limit = params?.limit ? Number(params.limit) : 16;
    const page = params?.page ? Number(params.page) : 1;
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .populate('category', 'name _id')
        .populate('subcategory', 'name _id')
        .exec(),
      this.productModel.countDocuments(filter),
    ]);
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
  async getCategoriesWithSubcategories(
    limit?: number,
    page?: number,
  ): Promise<CategoryPaginationResult> {
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
    const total = result.length;
    const usedLimit = limit !== undefined ? Number(limit) : total;
    const usedPage = page !== undefined ? Number(page) : 1;
    let paged = result;
    if (limit !== undefined && page !== undefined) {
      const skip = (usedPage - 1) * usedLimit;
      paged = result.slice(skip, skip + usedLimit);
    }
    const pages = Math.ceil(total / usedLimit) || 1;
    return {
      total,
      page: usedPage,
      limit: usedLimit,
      pages,
      categories: paged,
    };
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
      category?: string;
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

      if (options.category) {
        filter.category = { $regex: `^${options.category}$`, $options: 'i' };
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
      query.gender || 'all',
      query.collection || 'all',
      query.action || 'all',
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

    // Only add filters if they are provided
    if (query.category && query.category.trim()) {
      filter.category = { $regex: query.category, $options: 'i' };
    }

    if (query.subcategory && query.subcategory.trim()) {
      filter.subcategory = { $regex: query.subcategory, $options: 'i' };
    }

    if (query.material && query.material.trim()) {
      filter['variants.material'] = {
        $regex: query.material,
        $options: 'i',
      };
    }

    if (query.insert && query.insert.trim()) {
      filter['variants.insert'] = {
        $regex: query.insert,
        $options: 'i',
      };
    }

    if (query.inStock !== undefined && query.inStock !== null) {
      filter['variants.inStock'] = { $gte: Number(query.inStock) };
    }

    if (query.gender && query.gender.trim()) {
      filter.gender = { $regex: query.gender, $options: 'i' };
    }

    if (query.collection && query.collection.trim()) {
      filter.prod_collection = { $regex: query.collection, $options: 'i' };
    }

    if (query.action && query.action.trim()) {
      filter.action = { $regex: query.action, $options: 'i' };
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
        case 'discount_desc':
          sortOption.discount = -1;
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
      const cachePatterns = ['products:compare:*', 'products:optimized:*'];

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
