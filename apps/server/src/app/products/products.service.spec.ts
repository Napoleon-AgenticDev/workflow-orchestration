import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductsService } from './products.service';
import { Product, ProductStatus } from './entities/product.entity';
import { NotFoundException } from '@nestjs/common';

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: Repository<Product>;

  const mockProduct: Product = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Product',
    description: 'Test description',
    status: ProductStatus.PLANNING,
    metadata: { priority: 'high' },
    features: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repository = module.get<Repository<Product>>(getRepositoryToken(Product));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a product', async () => {
      mockRepository.create.mockReturnValue(mockProduct);
      mockRepository.save.mockResolvedValue(mockProduct);

      const result = await service.create({ name: 'Test Product', description: 'Test description' });

      expect(mockRepository.create).toHaveBeenCalledWith({ name: 'Test Product', description: 'Test description' });
      expect(mockRepository.save).toHaveBeenCalledWith(mockProduct);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      mockRepository.find.mockResolvedValue([mockProduct]);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({ relations: ['features'] });
      expect(result).toEqual([mockProduct]);
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findOne(mockProduct.id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: mockProduct.id }, relations: ['features'] });
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a product', async () => {
      mockRepository.findOne.mockResolvedValue(mockProduct);
      mockRepository.remove.mockResolvedValue(mockProduct);

      await service.remove(mockProduct.id);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockProduct);
    });
  });

  describe('getProgress', () => {
    it('should calculate progress correctly', async () => {
      const productWithFeatures = {
        ...mockProduct,
        features: [
          { status: 'Done' },
          { status: 'Done' },
          { status: 'Todo' },
        ],
      };
      mockRepository.findOne.mockResolvedValue(productWithFeatures);

      const result = await service.getProgress(mockProduct.id);

      expect(result).toEqual({ total: 3, completed: 2, percentage: 67 });
    });

    it('should return 0% for product with no features', async () => {
      mockRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.getProgress(mockProduct.id);

      expect(result).toEqual({ total: 0, completed: 0, percentage: 0 });
    });
  });
});
