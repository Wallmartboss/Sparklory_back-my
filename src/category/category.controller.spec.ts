import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

describe('CategoryController', () => {
  let controller: CategoryController;
  let service: CategoryService;

  const mockCategory = {
    name: 'earrings',
    image: 'https://example.com/earrings.jpg',
  };

  const mockCategoryService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByName: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    removeAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        {
          provide: CategoryService,
          useValue: mockCategoryService,
        },
      ],
    }).compile();

    controller = module.get<CategoryController>(CategoryController);
    service = module.get<CategoryService>(CategoryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const createCategoryDto: CreateCategoryDto = {
        name: 'earrings',
        image: 'https://example.com/earrings.jpg',
      };

      jest.spyOn(service, 'create').mockResolvedValue(mockCategory);

      const result = await controller.create(createCategoryDto);
      expect(result).toEqual(mockCategory);
      expect(service.create).toHaveBeenCalledWith(createCategoryDto);
    });

    it('should throw ConflictException if category already exists', async () => {
      const createCategoryDto: CreateCategoryDto = {
        name: 'earrings',
        image: 'https://example.com/earrings.jpg',
      };

      jest
        .spyOn(service, 'create')
        .mockRejectedValue(
          new ConflictException('Category with name "earrings" already exists'),
        );

      await expect(controller.create(createCategoryDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of categories', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValue([mockCategory]);

      const result = await controller.findAll();
      expect(result).toEqual([mockCategory]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findByName', () => {
    it('should return a category by name', async () => {
      jest.spyOn(service, 'findByName').mockResolvedValue(mockCategory);

      const result = await controller.findByName('earrings');
      expect(result).toEqual(mockCategory);
      expect(service.findByName).toHaveBeenCalledWith('earrings');
    });

    it('should throw NotFoundException if category not found', async () => {
      jest
        .spyOn(service, 'findByName')
        .mockRejectedValue(
          new NotFoundException('Category with name "nonexistent" not found'),
        );

      await expect(controller.findByName('nonexistent')).rejects.toThrow(
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

      const updatedCategory = { ...mockCategory, ...updateCategoryDto };
      jest.spyOn(service, 'update').mockResolvedValue(updatedCategory);

      const result = await controller.update('earrings', updateCategoryDto);
      expect(result).toEqual(updatedCategory);
      expect(service.update).toHaveBeenCalledWith(
        'earrings',
        updateCategoryDto,
      );
    });

    it('should throw NotFoundException if category not found', async () => {
      const updateCategoryDto: UpdateCategoryDto = {
        name: 'updated-earrings',
      };

      jest
        .spyOn(service, 'update')
        .mockRejectedValue(
          new NotFoundException('Category with name "nonexistent" not found'),
        );

      await expect(
        controller.update('nonexistent', updateCategoryDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a category', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue(mockCategory);

      await controller.remove('earrings');
      expect(service.remove).toHaveBeenCalledWith('earrings');
    });

    it('should throw NotFoundException if category not found', async () => {
      jest
        .spyOn(service, 'remove')
        .mockRejectedValue(
          new NotFoundException('Category with name "nonexistent" not found'),
        );

      await expect(controller.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeAll', () => {
    it('should remove all categories', async () => {
      jest.spyOn(service, 'removeAll').mockResolvedValue({ deletedCount: 5 });

      await controller.removeAll();
      expect(service.removeAll).toHaveBeenCalled();
    });
  });
});
