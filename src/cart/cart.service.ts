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
    let cart: CartDocument | null = null;
    if (userId) {
      cart = await this.cartModel.findOne({ user: userId, isOrdered: false });
      if (!cart) {
        cart = new this.cartModel({ user: userId, items: [] }) as CartDocument;
        await cart.save();
      }
      return cart;
    }
    if (guestId) {
      cart = await this.cartModel.findOne({ guestId, isOrdered: false });
      if (!cart) {
        cart = new this.cartModel({ guestId, items: [] }) as CartDocument;
        await cart.save();
      }
      return cart;
    }
    throw new Error('Either userId or guestId must be provided');
  }

  /**
   * Обчислює актуальну ціну продукту з урахуванням знижки
   */
  private getDiscountedPrice(
    product: ProductDocument,
    now: Date = new Date(),
  ): number {
    if (
      product.discount &&
      product.discount > 0 &&
      product.discountStart &&
      product.discountEnd &&
      now >= product.discountStart &&
      now <= product.discountEnd
    ) {
      return Math.round((product.price * (100 - product.discount)) / 100);
    }
    return product.price;
  }

  async addItem(
    userId: string | undefined,
    guestId: string | undefined,
    productId: string,
    // price: number, // убираем, цена вычисляется на сервере
    quantity = 1,
    size?: string,
    color?: string,
    email?: string,
  ) {
    const cart = await this.getOrCreateCart(userId, guestId);
    if (!userId && guestId && email && !cart.email) {
      cart.email = email;
    }
    const existingItem = cart.items.find(
      item =>
        item.product.toString() === productId &&
        item.size === size &&
        item.color === color,
    );

    // Получаем продукт и рассчитываем цену с учетом скидки
    const product = await this.productModel.findById(productId);
    if (!product) throw new Error('Product not found');
    const price = this.getDiscountedPrice(product);

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.price = price; // обновляем цену, если скидка изменилась
    } else {
      cart.items.push({
        product: new Types.ObjectId(productId),
        quantity,
        size,
        color,
        price,
      });
    }

    return cart.save();
  }

  async removeItem(
    userId: string | undefined,
    guestId: string | undefined,
    productId: string,
    size?: string,
    color?: string,
  ) {
    const cart = await this.getOrCreateCart(userId, guestId);

    const itemIndex = cart.items.findIndex(
      item =>
        item.product.toString() === productId &&
        item.size === size &&
        item.color === color,
    );

    if (itemIndex === -1) {
      return cart;
    }

    const item = cart.items[itemIndex];

    if (item.quantity > 1) {
      item.quantity -= 1;
    } else {
      cart.items.splice(itemIndex, 1);
    }

    return cart.save();
  }

  async clearCart(userId?: string, guestId?: string) {
    const cart = await this.getOrCreateCart(userId, guestId);
    cart.items = [];
    return cart.save();
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
      const totalAmount = cart.items.reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
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
        `Замовлення з ${cart.items.length} товарів`,
      );
    }
  }

  async getCartByOrderId(orderId: string): Promise<CartDocument | null> {
    return this.cartModel.findOne({ order_id: orderId });
  }

  /**
   * Оновлює підсумкову суму корзини з урахуванням купона та бонусів
   */
  async recalculateTotals(cart: CartDocument): Promise<void> {
    // Рахуємо попередню суму
    const preTotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    let discountedTotal = preTotal;
    let coupon = null;
    if (cart.appliedCoupon) {
      coupon = await this.couponService.findValidCoupon(cart.appliedCoupon);
      if (coupon.amount) {
        discountedTotal = Math.max(0, discountedTotal - coupon.amount);
      } else if (coupon.percent) {
        discountedTotal = Math.max(0, discountedTotal * (1 - coupon.percent));
      }
    }
    const finalTotal = Math.max(0, discountedTotal - (cart.appliedBonus || 0));
    cart.preTotal = preTotal;
    cart.finalTotal = finalTotal;
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
