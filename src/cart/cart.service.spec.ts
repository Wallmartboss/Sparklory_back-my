import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from './cart.schema';
import { CartService } from './cart.service';

/**
 * Unit tests for CartService.
 */
describe('CartService', () => {
  let service: CartService;
  let mockCartModel: jest.Mocked<Model<CartDocument>>;

  const mockCart: Cart = {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(),
    items: [],
    isOrdered: false,
    save: jest.fn().mockResolvedValue(this),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
  } as unknown as Cart;

  function createMockQuery(result: unknown) {
    return { exec: jest.fn().mockResolvedValue(result) };
  }

  const mockQuery = createMockQuery(mockCart);
  const mockNullQuery = createMockQuery(null);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: getModelToken(Cart.name),
          useValue: {
            new: jest.fn().mockResolvedValue(mockCart),
            constructor: jest.fn().mockResolvedValue(mockCart),
            find: jest.fn().mockReturnValue(mockQuery),
            findOne: jest.fn().mockReturnValue(mockQuery),
            findById: jest.fn().mockReturnValue(mockQuery),
            update: jest.fn(),
            create: jest.fn(),
            remove: jest.fn(),
            exec: jest.fn(),
            deleteOne: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
            }),
          },
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
      const userId = new Types.ObjectId().toString();
      const result = await service.getOrCreateCart(userId);
      expect(result).toEqual(mockCart);
    });

    it('should create new cart if not exists', async () => {
      const userId = new Types.ObjectId().toString();
      mockCartModel.findOne.mockReturnValue(mockNullQuery);
      const result = await service.getOrCreateCart(userId);
      expect(result).toBeDefined();
    });
  });

  describe('addItem', () => {
    it('should add item to cart', async () => {
      const cartId = new Types.ObjectId().toString();
      const productId = new Types.ObjectId().toString();
      const quantity = 1;
      const result = await service.addItem(cartId, productId, quantity);
      expect(result).toBeDefined();
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', async () => {
      const cartId = new Types.ObjectId().toString();
      const productId = new Types.ObjectId().toString();
      const result = await service.removeItem(cartId, productId);
      expect(result).toBeDefined();
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
