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

  describe('create', () => {
    it('should create a cart', async () => {
      const createCartDto = {
        userId: new Types.ObjectId().toString(),
        items: [],
      };

      mockCartService.create.mockResolvedValue(mockCart);

      const result = await controller.create(createCartDto);
      expect(result).toBe(mockCart);
      expect(mockCartService.create).toHaveBeenCalledWith(createCartDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of carts', async () => {
      const mockCarts = [mockCart];
      mockCartService.findAll.mockResolvedValue(mockCarts);

      const result = await controller.findAll();
      expect(result).toBe(mockCarts);
      expect(mockCartService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a cart by id', async () => {
      const cartId = new Types.ObjectId().toString();
      mockCartService.findOne.mockResolvedValue(mockCart);

      const result = await controller.findOne(cartId);
      expect(result).toBe(mockCart);
      expect(mockCartService.findOne).toHaveBeenCalledWith(cartId);
    });
  });

  describe('getMyCart', () => {
    it('should return user cart', async () => {
      mockCartService.getOrCreateCart.mockResolvedValue(mockCart);

      const result = await controller.getMyCart({ user: mockUser });
      expect(result).toBe(mockCart);
      expect(mockCartService.getOrCreateCart).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('update', () => {
    it('should update a cart', async () => {
      const cartId = new Types.ObjectId().toString();
      const updateCartDto = { items: [] };
      mockCartService.update.mockResolvedValue(mockCart);

      const result = await controller.update(cartId, updateCartDto);
      expect(result).toBe(mockCart);
      expect(mockCartService.update).toHaveBeenCalledWith(
        cartId,
        updateCartDto,
      );
    });
  });

  describe('remove', () => {
    it('should remove a cart', async () => {
      const cartId = new Types.ObjectId().toString();
      mockCartService.remove.mockResolvedValue(mockCart);

      const result = await controller.remove(cartId);
      expect(result).toBe(mockCart);
      expect(mockCartService.remove).toHaveBeenCalledWith(cartId);
    });
  });

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

  describe('clearItems', () => {
    it('should clear all items from cart', async () => {
      const cartId = new Types.ObjectId().toString();
      mockCartService.clearItems.mockResolvedValue(mockCart);

      const result = await controller.clearItems(cartId);
      expect(result).toBe(mockCart);
      expect(mockCartService.clearItems).toHaveBeenCalledWith(cartId);
    });
  });
});
