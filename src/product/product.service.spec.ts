import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ProductService } from './product.service';
import {
  Product,
  ProductDocument,
  ProductSchema,
} from './schema/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { NotFoundException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

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
        providers: [ProductService],
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
        material: 'Test Material',
        engraving: false,
        price: 10000,
        image: ['Test Image'],
        inStock: true,
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
        material: 'Material 1',
        engraving: false,
        price: 10000,
        image: ['Image 1'],
        inStock: true,
      });

      const product2 = await productModel.create({
        name: 'Product 2',
        description: 'Description 2',
        category: 'Category 2',
        material: 'Material 2',
        engraving: true,
        price: 20000,
        image: ['Image 2', 'Image 3'],
        inStock: false,
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
        material: 'Test Material',
        engraving: false,
        price: 10000,
        image: ['Test Image'],
        inStock: true,
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
        material: 'Test Material',
        engraving: false,
        price: 10000,
        image: ['Test Image'],
        inStock: true,
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
        material: 'Test Material',
        engraving: false,
        price: 10000,
        image: ['Test Image'],
        inStock: true,
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
