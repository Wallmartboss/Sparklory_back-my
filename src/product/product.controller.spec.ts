import { Test, TestingModule } from '@nestjs/testing';
import { Gender } from '../common/enum/user.enum';
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
        engraving: false,
        image: ['Test Image'],
        action: ['Test Action'],
        prod_collection: 'Test Collection',
        discount: 10,
        discountStart: new Date('2025-01-01T00:00:00.000Z'),
        discountEnd: new Date('2025-01-10T00:00:00.000Z'),
        subcategory: ['sub1'],
        gender: Gender.Unisex,
        details: ['Handmade'],
        reviews: [],
        variants: [
          {
            material: 'silver',
            size: 'L',
            price: 100,
            insert: 'Silver',
            inStock: 5,
          },
        ],
      };
      const result = {
        id: '1',
        ...dto,
        image: dto.image ?? [],
        action: dto.action ?? [],
        reviews: [],
        prod_collection: dto.prod_collection ?? '',
        discount: dto.discount ?? 0,
        discountStart: dto.discountStart ?? new Date(0),
        discountEnd: dto.discountEnd ?? new Date(0),
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
          engraving: false,
          image: ['Test Image'],
          action: ['Test Action'],
          prod_collection: 'Test Collection',
          discount: 10,
          discountStart: new Date('2025-01-01T00:00:00.000Z'),
          discountEnd: new Date('2025-01-10T00:00:00.000Z'),
          subcategory: ['sub1'],
          gender: Gender.Unisex,
          details: ['Handmade'],
          reviews: [],
          variants: [
            {
              material: 'silver',
              size: 'L',
              price: 100,
              insert: 'Silver',
              inStock: 5,
            },
          ],
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
        engraving: false,
        image: ['Test Image'],
        action: ['Test Action'],
        prod_collection: 'Test Collection',
        discount: 10,
        discountStart: new Date('2025-01-01T00:00:00.000Z'),
        discountEnd: new Date('2025-01-10T00:00:00.000Z'),
        subcategory: ['sub1'],
        gender: Gender.Unisex,
        details: ['Handmade'],
        reviews: [],
        variants: [
          {
            material: 'silver',
            size: 'L',
            price: 100,
            insert: 'Silver',
            inStock: 5,
          },
        ],
      };
      jest.spyOn(productService, 'findOne').mockResolvedValue(result);
      expect(await productController.findOne(id)).toBe(result);
    });
  });

  describe('update', () => {
    it('should call productService.update and return an updated product', async () => {
      const id = '1';
      const dto: UpdateProductDto = {
        variants: [
          {
            material: 'silver',
            size: 'L',
            price: 150,
            insert: 'Silver',
            inStock: 5,
          },
        ],
      };
      const result = {
        id: '1',
        name: 'Test Product',
        description: 'Test Description',
        category: 'Test Category',
        engraving: false,
        image: ['Test Image'],
        action: ['Test Action'],
        prod_collection: 'Test Collection',
        discount: 10,
        discountStart: new Date('2025-01-01T00:00:00.000Z'),
        discountEnd: new Date('2025-01-10T00:00:00.000Z'),
        subcategory: ['sub1'],
        gender: Gender.Unisex,
        details: ['Handmade'],
        reviews: [],
        variants: [
          {
            material: 'silver',
            size: 'L',
            price: 150,
            insert: 'Silver',
            inStock: 5,
          },
        ],
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
        engraving: false,
        image: ['Test Image'],
        action: ['Test Action'],
        prod_collection: 'Test Collection',
        discount: 10,
        discountStart: new Date('2025-01-01T00:00:00.000Z'),
        discountEnd: new Date('2025-01-10T00:00:00.000Z'),
        subcategory: ['sub1'],
        gender: Gender.Unisex,
        details: ['Handmade'],
        reviews: [],
        variants: [
          {
            material: 'silver',
            size: 'L',
            price: 150,
            insert: 'Silver',
            inStock: 5,
          },
        ],
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
