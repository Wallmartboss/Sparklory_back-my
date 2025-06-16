import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from './cart.schema';

@Injectable()
export class CartService {
  constructor(@InjectModel(Cart.name) private cartModel: Model<CartDocument>) {}

  async getOrCreateCart(userId: string): Promise<CartDocument> {
    let cart: CartDocument | null = await this.cartModel.findOne({ user: userId, isOrdered: false });
    if (!cart) {
      cart = new this.cartModel({ user: userId, items: [] }) as CartDocument;
      await cart.save();
    }
    return cart;
  }

  async addItem(userId: string, productId: string, quantity = 1) {
    const cart = await this.getOrCreateCart(userId);
    const existingItem = cart.items.find(item => item.product.toString() === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ product: new Types.ObjectId(productId), quantity });
    }

    return cart.save();
  }

  async removeItem(userId: string, productId: string) {
    const cart = await this.getOrCreateCart(userId);
    cart.items = cart.items.filter(
      item => item.product.toString() !== productId,
    );
    return cart.save();
  }

  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    cart.items = [];
    return cart.save();
  }
}