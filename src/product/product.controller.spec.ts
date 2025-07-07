import { Test, TestingModule } from '@nestjs/testing';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

describe('ProductController', () => {
  let productController: ProductController;
  let productService: ProductService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn().mockResolvedValue([]),
            findByCategory: jest.fn().mockResolvedValue([]), // Mock implementation
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            getAllCategories: jest.fn().mockResolvedValue(['cat1', 'cat2']), // mock for categories
          },
        },
      ],
    }).compile();

    productController = module.get<ProductController>(ProductController);
    productService = module.get<ProductService>(ProductService);
  });

  it('should be defined', () => {
    expect(productController).toBeDefined();
  });

  describe('create', () => {
    it('should call productService.create and return a product', async () => {
      const dto: CreateProductDto = {
        name: 'Test Product',
        description: 'Test Description',
        category: 'Test Category',
        material: 'Test Material',
        engraving: false,
        price: 100,
        image: ['Test Image'],
        inStock: true,
      };
      const result = {
        id: '1',
        ...dto,
        image: ['Test Image'],
        action: '',
        reviews: [],
      };
      jest.spyOn(productService, 'create').mockResolvedValue(result);
      expect(await productController.create(dto)).toBe(result);
    });
  });

  describe('findAll', () => {
    it('should return an array of products', async () => {
      expect(await productController.findAll()).toEqual([]);
    });
  });

  describe('findByCategory', () => {
    it('should call productService.findByCategory and return an array of products', async () => {
      const category = 'Test Category';
      const result = [
        {
          id: '1',
          name: 'Test Product',
          description: 'Test Description',
          category: 'Test Category',
          material: 'Test Material',
          engraving: false,
          price: 100,
          image: ['Test Image'],
          inStock: true,
          action: '',
          reviews: [],
        },
      ];
      jest.spyOn(productService, 'findByCategory').mockResolvedValue(result);
      expect(await productController.findByCategory(category)).toBe(result);
    });
  });

  describe('findOne', () => {
    it('should call productService.findOne and return a product', async () => {
      const id = '1';
      const result = {
        id: '1',
        name: 'Test Product',
        description: 'Test Description',
        category: 'Test Category',
        material: 'Test Material',
        engraving: false,
        price: 100,
        image: ['Test Image'],
        inStock: true,
        action: '',
        reviews: [],
      };
      jest.spyOn(productService, 'findOne').mockResolvedValue(result);
      expect(await productController.findOne(id)).toBe(result);
    });
  });

  describe('update', () => {
    it('should call productService.update and return an updated product', async () => {
      const id = '1';
      const dto: UpdateProductDto = { price: 150 };
      const result = {
        id: '1',
        name: 'Test Product',
        description: 'Test Description',
        category: 'Test Category',
        material: 'Test Material',
        engraving: false,
        price: 150,
        image: ['Test Image'],
        inStock: true,
        action: '',
        reviews: [],
      };
      jest.spyOn(productService, 'update').mockResolvedValue(result);
      expect(await productController.update(id, dto)).toBe(result);
    });
  });

  describe('remove', () => {
    it('should call productService.remove and return the removed product', async () => {
      const id = '1';
      const result = {
        id: '1',
        name: 'Test Product',
        description: 'Test Description',
        category: 'Test Category',
        material: 'Test Material',
        engraving: false,
        price: 100,
        image: ['Test Image'],
        inStock: true,
        action: '',
        reviews: [],
      };
      jest.spyOn(productService, 'remove').mockResolvedValue(result);
      expect(await productController.remove(id)).toBe(result);
    });
  });

  describe('getAllCategories', () => {
    it('should return an array of categories', async () => {
      const result = ['cat1', 'cat2'];
      jest.spyOn(productService, 'getAllCategories').mockResolvedValue(result);
      expect(await productController.getAllCategories()).toBe(result);
    });
  });
});
