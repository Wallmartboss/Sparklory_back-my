import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../product/schema/product.schema';
import { Cart, CartDocument } from './cart.schema';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
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

  async addItem(
    userId: string | undefined,
    guestId: string | undefined,
    productId: string,
    price: number,
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

    if (existingItem) {
      existingItem.quantity += quantity;
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
    await this.cartModel.findOneAndUpdate(
      { order_id: orderId },
      { isOrdered: true },
    );
  }

  async getCartByOrderId(orderId: string): Promise<CartDocument | null> {
    return this.cartModel.findOne({ order_id: orderId });
  }
}
