import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CouponService } from '../coupon/coupon.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { Product, ProductDocument } from '../product/schema/product.schema';
import { Cart, CartDocument } from './cart.schema';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @Inject(forwardRef(() => LoyaltyService))
    private readonly loyaltyService: LoyaltyService,
    private readonly couponService: CouponService,
  ) {}

  async getOrCreateCart(
    userId?: string,
    guestId?: string,
  ): Promise<CartDocument> {
    console.log(
      '[DEBUG][CartService.getOrCreateCart] userId:',
      userId,
      'guestId:',
      guestId,
    );
    let cart: CartDocument | null = null;
    if (userId) {
      cart = await this.cartModel.findOne({ user: userId, isOrdered: false });
      console.log(
        '[DEBUG][CartService.getOrCreateCart] Found cart for user:',
        cart?._id,
      );
      if (!cart) {
        cart = new this.cartModel({ user: userId, items: [] }) as CartDocument;
        await cart.save();
        console.log(
          '[DEBUG][CartService.getOrCreateCart] Created new cart:',
          cart._id,
        );
      }
      return cart;
    }
    if (guestId) {
      cart = await this.cartModel.findOne({ guestId, isOrdered: false });
      console.log(
        '[DEBUG][CartService.getOrCreateCart] Found cart for guest:',
        cart?._id,
      );
      if (!cart) {
        cart = new this.cartModel({ guestId, items: [] }) as CartDocument;
        await cart.save();
        console.log(
          '[DEBUG][CartService.getOrCreateCart] Created new cart:',
          cart._id,
        );
      }
      return cart;
    }
    throw new Error('Either userId or guestId must be provided');
  }

  /**
   * Calculates the actual product price considering discount
   */
  private getDiscountedPrice(
    product: ProductDocument,
    material?: string,
    size?: string,
    now: Date = new Date(),
  ): number {
    // Find the appropriate variant based on material and size
    let variant = product.variants[0]; // Default to first variant
    if (material || size) {
      variant =
        product.variants.find(
          v =>
            (!material || v.material === material) &&
            (!size || v.size === size),
        ) || product.variants[0];
    }

    const basePrice = variant.price || 0;

    if (
      product.discount &&
      product.discount > 0 &&
      product.discountStart &&
      product.discountEnd &&
      now >= product.discountStart &&
      now <= product.discountEnd
    ) {
      return Math.round((basePrice * (100 - product.discount)) / 100);
    }
    return basePrice;
  }

  async addItem(
    userId: string | undefined,
    guestId: string | undefined,
    productId: string,
    quantity = 1,
    size?: string,
    material?: string,
    insert?: string,
  ) {
    const cart = await this.getOrCreateCart(userId, guestId);

    // Get product and find the specific variant
    const product = await this.productModel.findById(productId);
    if (!product) throw new Error('Product not found');

    // Find the appropriate variant based on material, size, and insert
    const variant = product.variants.find(
      v =>
        (!material || v.material === material) &&
        (!size || v.size === size) &&
        (!insert || v.insert === insert),
    );

    if (!variant) {
      const requestedParams = [];
      if (material) requestedParams.push(`material: ${material}`);
      if (size) requestedParams.push(`size: ${size}`);
      if (insert) requestedParams.push(`insert: ${insert}`);

      const availableVariants = product.variants
        .map(v => `(${v.material}, ${v.size}, ${v.insert})`)
        .join(', ');

      throw new Error(
        `Variant not found with parameters: ${requestedParams.join(', ')}. ` +
          `Available variants: ${availableVariants}`,
      );
    }

    // Check stock availability
    const existingItem = cart.items.find(
      item =>
        item.product.toString() === productId &&
        item.size === size &&
        item.material === material &&
        item.insert === insert,
    );

    const requestedQuantity = quantity + (existingItem?.quantity || 0);

    if (requestedQuantity > variant.inStock) {
      throw new Error(
        `Insufficient stock. Available: ${variant.inStock}, Requested: ${requestedQuantity}`,
      );
    }

    const { firstPrice, discount, priceWithDiscount } = (() => {
      const basePrice = variant.price || 0;
      let discount = 0;
      let priceWithDiscount = basePrice;
      if (product.discount && product.discount > 0) {
        discount = product.discount;
        priceWithDiscount = Math.round(
          (basePrice * (100 - product.discount)) / 100,
        );
      }
      return {
        firstPrice: basePrice,
        discount,
        priceWithDiscount,
      };
    })();

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.firstPrice = firstPrice;
      existingItem.discount = discount;
      existingItem.priceWithDiscount = priceWithDiscount;
    } else {
      cart.items.push({
        product: new Types.ObjectId(productId),
        quantity,
        size,
        material,
        insert,
        firstPrice,
        discount,
        priceWithDiscount,
      });
    }

    const savedCart = await cart.save();
    if (!userId && guestId) {
      await this.recalculateTotals(savedCart);
      await savedCart.save();
    }
    return savedCart;
  }

  async removeItem(
    userId: string | undefined,
    guestId: string | undefined,
    productId: string,
    size?: string,
    material?: string,
    insert?: string,
  ) {
    const cart = await this.getOrCreateCart(userId, guestId);

    const itemIndex = cart.items.findIndex(
      item =>
        item.product.toString() === productId &&
        item.size === size &&
        item.material === material &&
        item.insert === insert,
    );

    if (itemIndex === -1) {
      return cart;
    }

    cart.items.splice(itemIndex, 1);

    return cart.save();
  }

  async clearCart(userId?: string, guestId?: string) {
    try {
      let query = {};
      if (userId) {
        query = { user: userId, isOrdered: false };
      } else if (guestId) {
        query = { guestId, isOrdered: false };
      } else {
        throw new Error('Either userId or guestId must be provided');
      }

      let cart = await this.cartModel.findOne(query);
      if (!cart) {
        cart = new this.cartModel({ ...query, items: [] });
      } else {
        cart.items = [];
      }
      await this.recalculateTotals(cart);
      return cart.save();
    } catch (error) {
      console.error(
        '[ERROR][CartService.clearCart] Error clearing cart:',
        error,
      );
      throw error;
    }
  }

  async updateOrderId(cartId: string, orderId: string): Promise<void> {
    await this.cartModel.findByIdAndUpdate(cartId, { order_id: orderId });
  }

  async setOrderedByOrderId(orderId: string): Promise<void> {
    console.log('[DEBUG][CartService.setOrderedByOrderId] orderId:', orderId);
    const cart = await this.cartModel.findOneAndUpdate(
      { order_id: orderId },
      { isOrdered: true },
      { new: true },
    );
    console.log(
      '[DEBUG][CartService.setOrderedByOrderId] cart:',
      JSON.stringify(cart, null, 2),
    );

    if (cart && cart.user && cart.items && cart.items.length > 0) {
      // Update stock quantities for all items in the order
      await this.updateStockQuantities(cart.items);

      const totalAmount = cart.items.reduce(
        (sum, item) =>
          sum + (item.priceWithDiscount || 0) * (item.quantity || 1),
        0,
      );
      console.log(
        '[DEBUG][CartService.setOrderedByOrderId] user:',
        cart.user.toString(),
      );
      console.log(
        '[DEBUG][CartService.setOrderedByOrderId] items:',
        JSON.stringify(cart.items, null, 2),
      );
      await this.loyaltyService.addOrderToHistory(
        cart.user.toString(),
        orderId,
        cart.items,
        totalAmount,
        new Date(),
        `Order with ${cart.items.length} items`,
      );
    }
  }

  /**
   * Update stock quantities after successful order payment
   */
  private async updateStockQuantities(items: any[]): Promise<void> {
    for (const item of items) {
      const product = await this.productModel.findById(item.product);
      if (!product) continue;

      // Find the specific variant and update its inStock
      const variantIndex = product.variants.findIndex(
        v =>
          (!item.material || v.material === item.material) &&
          (!item.size || v.size === item.size) &&
          (!item.insert || v.insert === item.insert),
      );

      if (variantIndex !== -1) {
        product.variants[variantIndex].inStock -= item.quantity;
        await product.save();
      }
    }
  }

  async getCartByOrderId(orderId: string): Promise<CartDocument | null> {
    return this.cartModel.findOne({ order_id: orderId });
  }

  /**
   * Оновлює підсумкову суму корзини з урахуванням купона та бонусів
   */
  async recalculateTotals(cart: CartDocument): Promise<void> {
    if (!cart.items || cart.items.length === 0) {
      cart.preTotal = 0;
      cart.finalTotal = 0;
      cart.firstAmount = 0;
      cart.amountWithDiscount = 0;
      cart.finalAmount = 0;
      cart.totalDiscount = 0;
      return;
    }
    // Сума товарів за стандартною ціною
    const firstAmount = cart.items.reduce(
      (sum, item) => sum + item.firstPrice * item.quantity,
      0,
    );
    // Сума товарів з урахуванням знижки
    const amountWithDiscount = cart.items.reduce(
      (sum, item) => sum + item.priceWithDiscount * item.quantity,
      0,
    );
    // Сума знижки
    const totalDiscount = firstAmount - amountWithDiscount;
    // Остаточна сума після купонів і бонусів
    let finalAmount = amountWithDiscount;
    let coupon = null;
    if (cart.appliedCoupon) {
      coupon = await this.couponService.findValidCoupon(cart.appliedCoupon);
      if (coupon.amount) {
        finalAmount = Math.max(0, finalAmount - coupon.amount);
      } else if (coupon.percent) {
        finalAmount = Math.max(0, finalAmount * (1 - coupon.percent));
      }
    }
    finalAmount = Math.max(0, finalAmount - (cart.appliedBonus || 0));
    cart.preTotal = firstAmount;
    cart.finalTotal = finalAmount;
    cart.firstAmount = firstAmount;
    cart.amountWithDiscount = amountWithDiscount;
    cart.finalAmount = finalAmount;
    cart.totalDiscount = totalDiscount;
  }

  /**
   * Оновлює ціни, знижки та firstPrice для всіх товарів у корзині на основі актуальних даних продукту
   */
  async updateCartItemsPrices(cart: CartDocument): Promise<void> {
    for (const item of cart.items) {
      const product = await this.productModel.findById(item.product);
      if (!product) continue;
      const variant = product.variants.find(
        v =>
          (!item.material || v.material === item.material) &&
          (!item.size || v.size === item.size) &&
          (!item.insert || v.insert === item.insert),
      );
      if (!variant) continue;
      const basePrice = variant.price || 0;
      let discount = 0;
      let priceWithDiscount = basePrice;
      if (product.discount && product.discount > 0) {
        discount = product.discount;
        priceWithDiscount = Math.round(
          (basePrice * (100 - product.discount)) / 100,
        );
      }
      item.firstPrice = basePrice;
      item.discount = discount;
      item.priceWithDiscount = priceWithDiscount;
    }
  }

  /**
   * Застосовує купон до корзини
   */
  async applyCoupon(userId: string, code: string): Promise<CartDocument> {
    // Отримуємо корзину користувача
    const cart = await this.getOrCreateCart(userId);
    // Знаходимо та перевіряємо купон
    const coupon = await this.couponService.findValidCoupon(code);
    // Зберігаємо застосований купон
    cart.appliedCoupon = coupon.code;
    // Перераховуємо підсумкову суму
    await this.recalculateTotals(cart);
    await cart.save();
    return cart;
  }

  /**
   * Застосовує бонуси до корзини
   */
  async applyBonus(userId: string, amount: number): Promise<CartDocument> {
    // Отримуємо корзину користувача
    const cart = await this.getOrCreateCart(userId);
    // Зберігаємо застосовану суму бонусів
    cart.appliedBonus = amount;
    // Перераховуємо підсумкову суму
    await this.recalculateTotals(cart);
    await cart.save();
    return cart;
  }
}
