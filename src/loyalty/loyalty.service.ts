import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LoyaltyAccount } from './loyalty-account.schema';
import { LoyaltyLevel } from './loyalty-level.schema';
import { PurchaseHistory } from './purchase-history.schema';

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectModel(LoyaltyAccount.name)
    private loyaltyModel: Model<LoyaltyAccount>,
    @InjectModel(PurchaseHistory.name)
    private purchaseModel: Model<PurchaseHistory>,
    @InjectModel(LoyaltyLevel.name) private levelModel: Model<LoyaltyLevel>,
  ) {}

  /**
   * Додає покупку, нараховує бонуси та оновлює рахунок користувача
   */
  async addPurchase(
    userId: string | Types.ObjectId,
    amount: number,
    description?: string,
  ) {
    const idStr = typeof userId === 'string' ? userId : userId?.toString();
    if (!idStr || idStr.length !== 24) {
      throw new Error('Некорректный userId');
    }
    const account = await this.loyaltyModel
      .findOne({ userId: new Types.ObjectId(idStr) })
      .populate('levelId');
    if (!account) throw new NotFoundException('Loyalty account not found');
    let bonusPercent = 0;
    if (
      account.levelId &&
      typeof account.levelId === 'object' &&
      'bonusPercent' in account.levelId
    ) {
      bonusPercent = (account.levelId as any).bonusPercent;
    }
    const bonus = amount * bonusPercent;
    await this.purchaseModel.create({
      userId,
      amount,
      date: new Date(),
      description,
    });
    account.totalAmount += amount;
    account.bonusBalance += bonus;
    await account.save();
    return {
      totalAmount: account.totalAmount,
      bonusBalance: account.bonusBalance,
      bonusAdded: bonus,
    };
  }

  /**
   * Повертає історію покупок користувача
   */
  async getHistory(userId: string) {
    return this.purchaseModel.find({ userId }).sort({ date: -1 });
  }

  /**
   * Повертає баланс бонусів користувача
   */
  async getBonusBalance(userId: string | Types.ObjectId) {
    const idStr = typeof userId === 'string' ? userId : userId?.toString();
    if (!idStr || idStr.length !== 24) {
      throw new Error('Некорректный userId');
    }
    const account = await this.loyaltyModel.findOne({
      userId: new Types.ObjectId(idStr),
    });
    if (!account) throw new NotFoundException('Loyalty account not found');
    return { bonusBalance: account.bonusBalance };
  }

  /**
   * Додає або оновлює номер карти лояльності користувача
   */
  async addCard(userId: string | Types.ObjectId, cardNumber: string) {
    const idStr = typeof userId === 'string' ? userId : userId?.toString();
    if (!idStr || idStr.length !== 24) {
      throw new Error('Некорректный userId');
    }
    const account = await this.loyaltyModel.findOne({
      userId: new Types.ObjectId(idStr),
    });
    if (!account) throw new NotFoundException('Loyalty account not found');
    account.cardNumber = cardNumber;
    await account.save();
    return { cardNumber: account.cardNumber };
  }

  // --- CRUD для рівнів лояльності (адмін) ---

  /**
   * Створює новий рівень лояльності
   */
  async createLevel(name: string, bonusPercent: number) {
    return this.levelModel.create({ name, bonusPercent });
  }

  /**
   * Оновлює відсоток бонусу для рівня лояльності
   */
  async updateLevel(levelId: string, bonusPercent: number) {
    const level = await this.levelModel.findById(levelId);
    if (!level) throw new NotFoundException('Loyalty level not found');
    level.bonusPercent = bonusPercent;
    await level.save();
    return level;
  }

  /**
   * Повертає всі рівні лояльності
   */
  async getLevels() {
    return this.levelModel.find();
  }

  /**
   * Призначає рівень лояльності користувачу
   */
  async assignLevel(userId: string | Types.ObjectId, levelId: string) {
    const idStr = typeof userId === 'string' ? userId : userId?.toString();
    if (!idStr || idStr.length !== 24) {
      throw new Error('Некорректный userId');
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
