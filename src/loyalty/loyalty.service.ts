import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CartItem } from '../cart/cart.schema';
import { CartService } from '../cart/cart.service';
import { LoyaltyAccount } from './loyalty-account.schema';
import { LoyaltyLevel } from './loyalty-level.schema';
import { PurchaseHistory } from './purchase-history.schema';

/**
 * Service for loyalty program logic, including purchase history and bonus management.
 */
@Injectable()
export class LoyaltyService {
  constructor(
    @InjectModel(LoyaltyAccount.name)
    private loyaltyModel: Model<LoyaltyAccount>,
    @InjectModel(PurchaseHistory.name)
    private purchaseModel: Model<PurchaseHistory>,
    @InjectModel(LoyaltyLevel.name) private levelModel: Model<LoyaltyLevel>,
    private readonly cartService: CartService,
  ) {}

  /**
   * Returns the user's purchase history.
   * @param userId User identifier
   */
  async getHistory(userId: string | Types.ObjectId) {
    const idStr = typeof userId === 'string' ? userId : userId?.toString();
    if (!idStr || idStr.length !== 24) {
      throw new Error('Некорректний userId');
    }
    return this.purchaseModel
      .find({ userId: new Types.ObjectId(idStr) })
      .sort({ date: -1 });
  }

  /**
   * Returns the user's bonus balance.
   * @param userId User identifier
   */
  async getBonusBalance(userId: string | Types.ObjectId) {
    const idStr = typeof userId === 'string' ? userId : userId?.toString();
    if (!idStr || idStr.length !== 24) {
      throw new Error('Некорректний userId');
    }
    const account = await this.loyaltyModel.findOne({
      userId: new Types.ObjectId(idStr),
    });
    if (!account) throw new NotFoundException('Loyalty account not found');
    return { bonusBalance: account.bonusBalance };
  }

  /**
   * Adds or updates the user's loyalty card number.
   * @param userId User identifier
   * @param cardNumber Loyalty card number
   */
  async addCard(userId: string | Types.ObjectId, cardNumber: string) {
    const idStr = typeof userId === 'string' ? userId : userId?.toString();
    if (!idStr || idStr.length !== 24) {
      throw new Error('Некорректний userId');
    }
    const account = await this.loyaltyModel.findOne({
      userId: new Types.ObjectId(idStr),
    });
    if (!account) throw new NotFoundException('Loyalty account not found');
    account.cardNumber = cardNumber;
    await account.save();
    return { cardNumber: account.cardNumber };
  }

  /**
   * Adds an order to the user's purchase history (orderId + items).
   * @param userId User identifier
   * @param orderId Order identifier
   * @param items Array of cart items
   * @param amount Total order amount
   * @param date Order date
   * @param description Optional description
   */
  async addOrderToHistory(
    userId: string | Types.ObjectId,
    orderId: string,
    items: CartItem[],
    amount: number,
    date: Date,
    description?: string,
  ) {
    console.log('[DEBUG][LoyaltyService.addOrderToHistory] userId:', userId);
    console.log('[DEBUG][LoyaltyService.addOrderToHistory] orderId:', orderId);
    console.log(
      '[DEBUG][LoyaltyService.addOrderToHistory] items:',
      JSON.stringify(items, null, 2),
    );
    console.log('[DEBUG][LoyaltyService.addOrderToHistory] amount:', amount);
    console.log('[DEBUG][LoyaltyService.addOrderToHistory] date:', date);
    console.log(
      '[DEBUG][LoyaltyService.addOrderToHistory] description:',
      description,
    );
    const idStr = typeof userId === 'string' ? userId : userId?.toString();
    if (!idStr || idStr.length !== 24) {
      throw new Error('Некорректний userId');
    }
    if (!amount || amount <= 0) {
      // Не додаємо замовлення з нулевою сумою
      return;
    }
    try {
      // Перевірка на дублювання замовлення
      const existing = await this.purchaseModel.findOne({
        userId: new Types.ObjectId(idStr),
        orderId,
      });
      if (existing) {
        console.warn(
          '[WARN][addOrderToHistory] Duplicate order, skipping:',
          orderId,
        );
        return;
      }
      // Валідація структури items
      if (
        !Array.isArray(items) ||
        items.length === 0 ||
        !items.every(
          item => item.product && item.quantity && item.price !== undefined,
        )
      ) {
        console.error(
          '[ERROR][addOrderToHistory] Invalid items structure:',
          JSON.stringify(items, null, 2),
        );
        return;
      }
      console.log('[DEBUG][addOrderToHistory] orderId:', orderId);
      console.log('[DEBUG][addOrderToHistory] userId:', idStr);
      console.log('[DEBUG][addOrderToHistory] amount:', amount);
      console.log(
        '[DEBUG][addOrderToHistory] items:',
        JSON.stringify(items, null, 2),
      );
      console.log('[DEBUG][addOrderToHistory] date:', date);
      console.log('[DEBUG][addOrderToHistory] description:', description);
      const purchase = await this.purchaseModel.create({
        userId: new Types.ObjectId(idStr),
        orderId,
        items,
        amount,
        date,
        description,
      });
      console.log('[DEBUG] Order added to history:', purchase);
    } catch (err) {
      console.error('[ERROR] Failed to add order to history:', err);
    }
  }

  /**
   * Adds a purchase for the user (stub for test)
   */
  async addPurchase(userId: string, amount: number, description?: string) {
    // Stub for test
    return { userId, amount, description };
  }

  // --- CRUD для рівнів лояльності (адмін) ---

  /**
   * Creates a new loyalty level.
   * @param name Level name
   * @param bonusPercent Bonus percent
   */
  async createLevel(name: string, bonusPercent: number) {
    return this.levelModel.create({ name, bonusPercent });
  }

  /**
   * Updates the bonus percent for a loyalty level.
   * @param levelId Level identifier
   * @param bonusPercent Bonus percent
   */
  async updateLevel(levelId: string, bonusPercent: number) {
    const level = await this.levelModel.findById(levelId);
    if (!level) throw new NotFoundException('Loyalty level not found');
    level.bonusPercent = bonusPercent;
    await level.save();
    return level;
  }

  /**
   * Returns all loyalty levels.
   */
  async getLevels() {
    return this.levelModel.find();
  }

  /**
   * Assigns a loyalty level to a user.
   * @param userId User identifier
   * @param levelId Level identifier
   */
  async assignLevel(userId: string | Types.ObjectId, levelId: string) {
    const idStr = typeof userId === 'string' ? userId : userId?.toString();
    if (!idStr || idStr.length !== 24) {
      throw new Error('Некорректний userId');
    }
    const account = await this.loyaltyModel.findOne({
      userId: new Types.ObjectId(idStr),
    });
    if (!account) throw new NotFoundException('Loyalty account not found');
    account.levelId = new Types.ObjectId(levelId);
    await account.save();
    return account;
  }
}
