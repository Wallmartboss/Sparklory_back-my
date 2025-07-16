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

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Check if the category exists
    const categoryExists = await this.categoryService.exists(
      createProductDto.category,
    );
    if (!categoryExists) {
      throw new BadRequestException(
        `NO SUCH CATEGORY, PLEASE CHECK OR ADD CATEGORY: ${createProductDto.category}`,
      );
    }

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
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async findByCategory(category: string): Promise<Product[]> {
    const products = await this.productModel.find({ category }).exec();
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

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    // If updating the category, check if it exists
    if (updateProductDto.category) {
      const categoryExists = await this.categoryService.exists(
        updateProductDto.category,
      );
      if (!categoryExists) {
        throw new BadRequestException(
          `NO SUCH CATEGORY, PLEASE CHECK OR ADD CATEGORY: ${updateProductDto.category}`,
        );
      }
    }

    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, {
        new: true,
        runValidators: true,
      })
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
    return this.productModel.distinct('category').exec();
  }

  /**
   * Get all products with a discount (discount > 0)
   */
  async findDiscounted(): Promise<Product[]> {
    return this.productModel.find({ discount: { $gt: 0 } }).exec();
  }

  /**
   * Creates a subscription for product back-in-stock notification
   */
  async createSubscription(productId: string, email: string) {
    // Check for existing active subscription
    const existing = await this.subscriptionModel.findOne({
      productId: new Types.ObjectId(productId),
      email,
      notified: false,
    });
    if (existing) {
      return { message: 'Already subscribed' };
    }
    await this.subscriptionModel.create({
      productId: new Types.ObjectId(productId),
      email,
      notified: false,
    });
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
}
