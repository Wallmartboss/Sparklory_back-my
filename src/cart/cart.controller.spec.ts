import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';

describe('CartController', () => {
  let controller: CartController;

  const mockUser = {
    id: new Types.ObjectId().toString(),
  };

  const mockCart = {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(),
    items: [],
    isOrdered: false,
  };

  const mockCartService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByUserId: jest.fn(),
    getOrCreateCart: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    addItem: jest.fn(),
    removeItem: jest.fn(),
    clearItems: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [
        {
          provide: CartService,
          useValue: mockCartService,
        },
      ],
    }).compile();

    controller = module.get<CartController>(CartController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Закомментировать или удалить тесты, использующие несуществующие методы CartController, если их нет в контроллере.
  // Исправить сигнатуры вызовов, чтобы они соответствовали реальным методам CartController.

  describe('addItem', () => {
    it('should add item to cart', async () => {
      const cartId = new Types.ObjectId().toString();
      const productId = new Types.ObjectId().toString();
      const quantity = 1;
      mockCartService.addItem.mockResolvedValue(mockCart);

      const result = await controller.addItem(cartId, productId, quantity);
      expect(result).toBe(mockCart);
      expect(mockCartService.addItem).toHaveBeenCalledWith(
        cartId,
        productId,
        quantity,
      );
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', async () => {
      const cartId = new Types.ObjectId().toString();
      const productId = new Types.ObjectId().toString();
      mockCartService.removeItem.mockResolvedValue(mockCart);

      const result = await controller.removeItem(cartId, productId);
      expect(result).toBe(mockCart);
      expect(mockCartService.removeItem).toHaveBeenCalledWith(
        cartId,
        productId,
      );
    });
  });
});
