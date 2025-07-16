import { NotFoundException } from '@nestjs/common';
import {
  MongooseModule,
  getConnectionToken,
  getModelToken,
} from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Model, Types } from 'mongoose';
import { CategoryService } from '../category/category.service';
import { Gender } from '../common/enum';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductService } from './product.service';
import {
  Product,
  ProductDocument,
  ProductSchema,
} from './schema/product.schema';

describe('ProductService', () => {
  let productService: ProductService;
  let productModel: Model<ProductDocument>;
  let mongod: MongoMemoryServer | null = null;
  let connection: Connection | null = null;
  let module: TestingModule;

  beforeAll(async () => {
    try {
      mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();

      module = await Test.createTestingModule({
        imports: [
          MongooseModule.forRootAsync({
            useFactory: () => ({ uri }),
          }),
          MongooseModule.forFeature([
            { name: Product.name, schema: ProductSchema },
          ]),
        ],
        providers: [
          ProductService,
          {
            provide: CategoryService,
            useValue: { exists: jest.fn().mockResolvedValue(true) },
          },
        ],
      }).compile();

      productService = module.get<ProductService>(ProductService);
      productModel = module.get<Model<ProductDocument>>(
        getModelToken(Product.name),
      );
      connection = module.get<Connection>(getConnectionToken());
    } catch (err) {
      console.error('Error in beforeAll:', err);
      throw err;
    }
  }, 30000);

  afterAll(async () => {
    if (connection) {
      await connection.close();
    }
    if (mongod) {
      await mongod.stop();
    }
    if (module) {
      await module.close();
    }
  }, 30000);

  afterEach(async () => {
    if (productModel) {
      await productModel.deleteMany({});
    }
  });

  it('should be defined', () => {
    expect(productService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const createProductDto: CreateProductDto = {
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
            material: 'Test Material',
            size: 'M',
            price: 10000,
            insert: 'Test Insert',
            inStock: 3,
          },
        ],
      };

      const result = (await productService.create(
        createProductDto,
      )) as ProductDocument;
      expect(result.toObject()).toMatchObject(createProductDto);
      expect(result._id).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return an empty array if no products exist', async () => {
      const result = (await productService.findAll()) as ProductDocument[];
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('should return all products', async () => {
      const product1 = await productModel.create({
        name: 'Product 1',
        description: 'Description 1',
        category: 'Category 1',
        engraving: false,
        image: ['Image 1'],
        action: ['Action 1'],
        prod_collection: 'Collection 1',
        discount: 5,
        discountStart: new Date('2025-01-01T00:00:00.000Z'),
        discountEnd: new Date('2025-01-10T00:00:00.000Z'),
        subcategory: ['sub1'],
        gender: Gender.Unisex,
        details: ['Detail 1'],
        reviews: [],
        variants: [
          {
            material: 'gold',
            size: 'M',
            price: 10000,
            insert: 'Gold',
            inStock: 3,
          },
        ],
      });
      const product2 = await productModel.create({
        name: 'Product 2',
        description: 'Description 2',
        category: 'Category 2',
        engraving: true,
        image: ['Image 2', 'Image 3'],
        action: ['Action 2'],
        prod_collection: 'Collection 2',
        discount: 0,
        discountStart: new Date('2025-02-01T00:00:00.000Z'),
        discountEnd: new Date('2025-02-10T00:00:00.000Z'),
        subcategory: ['sub2'],
        gender: Gender.Female,
        details: ['Detail 2'],
        reviews: [],
        variants: [
          {
            material: 'silver',
            size: 'L',
            price: 20000,
            insert: 'Silver',
            inStock: 2,
          },
        ],
      });

      const result = (await productService.findAll()) as ProductDocument[];
      expect(result).toHaveLength(2);
      expect(result.map(doc => doc.toObject())).toEqual(
        expect.arrayContaining([
          expect.objectContaining(product1.toObject()),
          expect.objectContaining(product2.toObject()),
        ]),
      );
    });
  });

  describe('findOne', () => {
    it('should return a product if found', async () => {
      const product = await productModel.create({
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
        details: ['Test Detail'],
        reviews: [],
        variants: [
          {
            material: 'Test Material',
            size: 'M',
            price: 10000,
            insert: 'Test Insert',
            inStock: 3,
          },
        ],
      });

      const result = (await productService.findOne(
        product._id.toString(),
      )) as ProductDocument;
      expect(result.toObject()).toMatchObject(product.toObject());
    });

    it('should throw NotFoundException if product is not found', async () => {
      const invalidId = new Types.ObjectId().toString();
      await expect(productService.findOne(invalidId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update and return the product', async () => {
      const product = await productModel.create({
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
        details: ['Test Detail'],
        reviews: [],
        variants: [
          {
            material: 'Test Material',
            size: 'M',
            price: 10000,
            insert: 'Test Insert',
            inStock: 3,
          },
        ],
      });

      const updateProductDto = { name: 'Updated Product' };
      const result = (await productService.update(
        product._id.toString(),
        updateProductDto,
      )) as ProductDocument;
      expect(result.toObject()).toMatchObject({
        ...product.toObject(),
        ...updateProductDto,
      });
    });
  });

  describe('remove', () => {
    it('should delete a product and return it', async () => {
      const product = await productModel.create({
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
        details: ['Test Detail'],
        reviews: [],
        variants: [
          {
            material: 'Test Material',
            size: 'M',
            price: 10000,
            insert: 'Test Insert',
            inStock: 3,
          },
        ],
      });

      const result = (await productService.remove(
        product._id.toString(),
      )) as ProductDocument;
      expect(result.toObject()).toMatchObject(product.toObject());

      const deletedProduct = await productModel.findById(product._id);
      expect(deletedProduct).toBeNull();
    });
  });
});
