import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Types } from 'mongoose';
import { CouponService } from '../coupon/coupon.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { Product } from '../product/schema/product.schema';
import { Cart, CartDocument } from './cart.schema';
import { CartService } from './cart.service';

/**
 * Unit tests for CartService.
 */
describe('CartService', () => {
  let service: CartService;
  let mockCartModel: jest.Mocked<Model<CartDocument>>;

  const mockProduct = {
    _id: new Types.ObjectId(),
    variants: [
      {
        material: 'gold',
        size: '17.5',
        insert: 'diamond',
        price: 100,
        inStock: 10,
      },
    ],
  };

  const mockCart: any = {
    _id: new Types.ObjectId(),
    user: new Types.ObjectId(), // поле user замість userId
    items: [
      {
        product: mockProduct._id,
        quantity: 1,
        size: '17.5',
        material: 'gold',
        insert: 'diamond',
        price: 100,
      },
    ],
    isOrdered: false,
    save: jest.fn(), // буде перевизначено в beforeEach
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
  };

  function createMockQuery(result: unknown) {
    return {
      exec: jest.fn().mockResolvedValue(result),
      _mongooseOptions: {},
      $where: jest.fn().mockReturnThis(),
      all: jest.fn().mockReturnThis(),
      allowDiskUse: jest.fn().mockReturnThis(),
    } as any;
  }

  const mockCartQuery = createMockQuery(mockCart);
  const mockProductQuery = createMockQuery(mockProduct);
  const mockNullQuery = createMockQuery(null);

  beforeEach(async () => {
    // save всегда возвращает mockCart!
    mockCart.save = jest.fn().mockResolvedValue(mockCart);
    mockCart.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: getModelToken(Cart.name),
          useValue: {
            new: jest.fn().mockImplementation(() => {
              mockCart.save = jest.fn().mockResolvedValue(mockCart);
              return mockCart;
            }),
            constructor: jest.fn().mockResolvedValue(mockCart),
            find: jest.fn().mockReturnValue(createMockQuery(mockCart)),
            findOne: jest.fn().mockImplementation(query => {
              if (
                query &&
                query.user &&
                query.user.toString() === mockCart.user.toString()
              ) {
                return createMockQuery(mockCart);
              }
              return createMockQuery(null);
            }),
            findById: jest.fn().mockReturnValue(createMockQuery(mockCart)),
            update: jest.fn(),
            create: jest.fn(),
            remove: jest.fn(),
            exec: jest.fn(),
            deleteOne: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
            }),
          },
        },
        {
          provide: getModelToken(Product.name),
          useValue: {
            findById: jest.fn().mockReturnValue(createMockQuery(mockProduct)),
          },
        },
        {
          provide: LoyaltyService,
          useValue: {},
        },
        {
          provide: CouponService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    mockCartModel = module.get<Model<CartDocument>>(
      getModelToken(Cart.name),
    ) as jest.Mocked<Model<CartDocument>>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Закомментировать или удалить тесты, использующие несуществующие методы CartService, если их нет в сервисе.

  describe('getOrCreateCart', () => {
    it('should return existing cart', async () => {
      const userId = mockCart.user.toString();
      const result = await service.getOrCreateCart(userId);
      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
    });

    it('should create new cart if not exists', async () => {
      const userId = new Types.ObjectId().toString();
      mockCartModel.findOne.mockImplementation(query => createMockQuery(null));
      const result = await service.getOrCreateCart(userId);
      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
    });
  });

  describe('addItem', () => {
    it('should add item to cart', async () => {
      const userId = mockCart.user.toString();
      const guestId = undefined;
      const productId = mockProduct._id.toString();
      const quantity = 1;
      const size = '17.5';
      const material = 'gold';
      const insert = 'diamond';
      const result = await service.addItem(
        userId,
        guestId,
        productId,
        quantity,
        size,
        material,
        insert,
      );
      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', async () => {
      const userId = mockCart.user.toString();
      const guestId = undefined;
      const productId = mockProduct._id.toString();
      const size = '17.5';
      const material = 'gold';
      const insert = 'diamond';
      const result = await service.removeItem(
        userId,
        guestId,
        productId,
        size,
        material,
        insert,
      );
      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
    });
  });

  // Commented out: clearItems test, as clearItems does not exist in CartService
  // describe('clearItems', () => {
  //   it('should clear all items from cart', async () => {
  //     const cartId = new Types.ObjectId().toString();
  //     const result = await service.clearItems(cartId);
  //     expect(result).toBeDefined();
  //   });
  // });
});
