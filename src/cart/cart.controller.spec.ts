import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
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
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<CartController>(CartController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Закомментировать или удалить тесты, использующие несуществующие методы CartController, если их нет в контроллере.
  // Исправить сигнатуры вызовов, чтобы они соответствовали реальным методам CartController.

  describe('addItem', () => {
    it('should add item to cart', async () => {
      const req = { user: { id: 'userId' } };
      const addToCartDto = {
        productId: 'productId',
        quantity: 1,
        size: '17.5',
        material: 'gold',
        insert: 'diamond',
      };
      mockCartService.addItem.mockResolvedValue(mockCart);

      const result = await controller.addItem(req, addToCartDto);
      expect(result).toBe(mockCart);
      expect(mockCartService.addItem).toHaveBeenCalledWith(
        'userId',
        undefined,
        'productId',
        1,
        '17.5',
        'gold',
        'diamond',
      );
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', async () => {
      const req = { user: { id: 'userId' } };
      const removeFromCartDto = {
        productId: 'productId',
        size: '17.5',
        material: 'gold',
        insert: 'diamond',
      };
      mockCartService.removeItem.mockResolvedValue(mockCart);

      const result = await controller.removeItem(req, removeFromCartDto);
      expect(result).toBe(mockCart);
      expect(mockCartService.removeItem).toHaveBeenCalledWith(
        'userId',
        'productId',
        '17.5',
        'gold',
        'diamond',
      );
    });
  });
});
