import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Types } from 'mongoose';
import { CartItem } from '../cart/cart.schema';
import { CartService } from '../cart/cart.service';
import { LoyaltyAccount } from './loyalty-account.schema';
import { LoyaltyLevel } from './loyalty-level.schema';
import { LoyaltyService } from './loyalty.service';
import { PurchaseHistory } from './purchase-history.schema';

describe('LoyaltyService', () => {
  let service: LoyaltyService;
  let purchaseModel: Model<PurchaseHistory>;
  let cartService: CartService;
  let mockCartService: Partial<CartService>;

  beforeEach(async () => {
    mockCartService = {
      getOrCreateCart: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoyaltyService,
        {
          provide: getModelToken(PurchaseHistory.name),
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getModelToken(LoyaltyAccount.name),
          useValue: {
            findOne: jest.fn().mockReturnValue({
              populate: jest.fn().mockResolvedValue({
                totalAmount: 0,
                bonusBalance: 0,
                save: jest.fn(),
                levelId: { bonusPercent: 0 },
              }),
            }),
          },
        },
        {
          provide: getModelToken(LoyaltyLevel.name),
          useValue: {},
        },
        {
          provide: CartService,
          useValue: mockCartService,
        },
      ],
    }).compile();
    service = module.get<LoyaltyService>(LoyaltyService);
    purchaseModel = module.get(getModelToken(PurchaseHistory.name));
    cartService = module.get(CartService);
  });

  it('має створювати запис з orderId та items (addOrderToHistory)', async () => {
    // Arrange
    const userId = new Types.ObjectId();
    const orderId = 'ORDER123';
    const items: CartItem[] = [
      { product: new Types.ObjectId(), quantity: 2, price: 100 },
    ];
    const amount = 200;
    const date = new Date();
    (purchaseModel.create as jest.Mock).mockResolvedValue({ orderId, items });

    // Act
    await service.addOrderToHistory(userId, orderId, items, amount, date);

    // Assert
    expect(purchaseModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        orderId,
        items,
        amount,
        date,
      }),
    );
  });

  // Commented out: addPurchase test, as addPurchase does not exist in LoyaltyService
  // it('має створювати запис з масивом items при addPurchase', async () => {
  //   // Arrange
  //   const userId = new Types.ObjectId();
  //   const amount = 100;
  //   const cartItems: CartItem[] = [
  //     { product: new Types.ObjectId(), quantity: 1, price: 100 },
  //   ];
  //   (cartService.getOrCreateCart as jest.Mock).mockResolvedValue({
  //     isOrdered: true,
  //     items: cartItems,
  //   });
  //   (purchaseModel.create as jest.Mock).mockResolvedValue({ items: cartItems });
  //
  //   // Act
  //   await service.addPurchase(userId, amount, 'desc');
  //
  //   // Assert
  //   expect(purchaseModel.create).toHaveBeenCalledWith(
  //     expect.objectContaining({
  //       items: cartItems,
  //     }),
  //   );
  // });

  it('не створює запис, якщо сума 0 або менше (addOrderToHistory)', async () => {
    // Arrange
    const userId = new Types.ObjectId();
    const orderId = 'ORDER123';
    const items: CartItem[] = [];
    const amount = 0;
    const date = new Date();

    // Act
    await service.addOrderToHistory(userId, orderId, items, amount, date);

    // Assert
    expect(purchaseModel.create).not.toHaveBeenCalled();
  });
});
