import { ConflictException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './category.schema';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

describe('CategoryService', () => {
  let service: CategoryService;
  let model: Model<CategoryDocument>;

  const mockCategory = {
    name: 'earrings',
    image: 'https://example.com/earrings.jpg',
    save: jest.fn().mockResolvedValue(this),
  };

  // Mock for the model constructor
  const mockCategoryModelConstructor = jest.fn().mockImplementation(dto => ({
    ...dto,
    save: jest.fn().mockResolvedValue({ ...dto }),
  }));

  const mockCategoryModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
    deleteMany: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: getModelToken(Category.name),
          useValue: Object.assign(
            mockCategoryModelConstructor,
            mockCategoryModel,
          ),
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    model = module.get<Model<CategoryDocument>>(getModelToken(Category.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const createCategoryDto: CreateCategoryDto = {
        name: 'earrings',
        image: 'https://example.com/earrings.jpg',
      };

      // Mock findOne to return null (category does not exist)
      jest.spyOn(model, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      // Use the mock constructor for creating a new category
      const result = await service.create(createCategoryDto);
      expect(result).toEqual(createCategoryDto);
    });

    it('should throw ConflictException if category already exists', async () => {
      const createCategoryDto: CreateCategoryDto = {
        name: 'earrings',
        image: 'https://example.com/earrings.jpg',
      };

      // Mock findOne to return an existing category
      jest.spyOn(model, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCategory),
      } as any);

      await expect(service.create(createCategoryDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of categories', async () => {
      // Mock find to return an array of categories
      jest.spyOn(model, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockCategory]),
      } as any);

      const result = await service.findAll();
      expect(result).toEqual([mockCategory]);
    });
  });

  describe('findByName', () => {
    it('should return a category by name', async () => {
      // Mock findOne to return a category
      jest.spyOn(model, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCategory),
      } as any);

      const result = await service.findByName('earrings');
      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException if category not found', async () => {
      // Mock findOne to return null
      jest.spyOn(model, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.findByName('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const updateCategoryDto: UpdateCategoryDto = {
        name: 'updated-earrings',
        image: 'https://example.com/updated-earrings.jpg',
      };

      // Mock findOne to return null (no conflict)
      jest.spyOn(model, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      // Mock findOneAndUpdate to return the updated category
      jest.spyOn(model, 'findOneAndUpdate').mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue({ ...mockCategory, ...updateCategoryDto }),
      } as any);

      const result = await service.update('earrings', updateCategoryDto);
      expect(result).toEqual({ ...mockCategory, ...updateCategoryDto });
    });

    it('should throw NotFoundException if category not found', async () => {
      const updateCategoryDto: UpdateCategoryDto = {
        name: 'updated-earrings',
      };

      // Mock findOne to return null (no conflict)
      jest.spyOn(model, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      // Mock findOneAndUpdate to return null (not found)
      jest.spyOn(model, 'findOneAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(
        service.update('nonexistent', updateCategoryDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a category', async () => {
      // Mock findOneAndDelete to return the deleted category
      jest.spyOn(model, 'findOneAndDelete').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCategory),
      } as any);

      const result = await service.remove('earrings');
      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException if category not found', async () => {
      // Mock findOneAndDelete to return null
      jest.spyOn(model, 'findOneAndDelete').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeAll', () => {
    it('should remove all categories', async () => {
      // Mock deleteMany to return a deletedCount
      jest.spyOn(model, 'deleteMany').mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 5 }),
      } as any);

      const result = await service.removeAll();
      expect(result).toEqual({ deletedCount: 5 });
    });
  });

  describe('exists', () => {
    it('should return true if category exists', async () => {
      // Mock findOne to return a category
      jest.spyOn(model, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCategory),
      } as any);

      const result = await service.exists('earrings');
      expect(result).toBe(true);
    });

    it('should return false if category does not exist', async () => {
      // Mock findOne to return null
      jest.spyOn(model, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      const result = await service.exists('nonexistent');
      expect(result).toBe(false);
    });
  });
});
