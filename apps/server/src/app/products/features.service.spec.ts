import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeaturesService } from './features.service';
import { ProductFeature, FeatureStatus } from '../products/entities/product-feature.entity';
import { NotFoundException } from '@nestjs/common';

describe('FeaturesService', () => {
  let service: FeaturesService;
  let repository: Repository<ProductFeature>;

  const mockFeature: ProductFeature = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Test Feature',
    description: 'Test feature description',
    status: FeatureStatus.TODO,
    productId: '123e4567-e89b-12d3-a456-426614174000',
    product: {} as any,
    metadata: { priority: 'medium' },
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
        FeaturesService,
        {
          provide: getRepositoryToken(ProductFeature),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<FeaturesService>(FeaturesService);
    repository = module.get<Repository<ProductFeature>>(getRepositoryToken(ProductFeature));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a feature', async () => {
      mockRepository.create.mockReturnValue(mockFeature);
      mockRepository.save.mockResolvedValue(mockFeature);

      const result = await service.create({
        name: 'Test Feature',
        description: 'Test feature description',
        productId: mockFeature.productId,
      });

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalledWith(mockFeature);
      expect(result).toEqual(mockFeature);
    });
  });

  describe('findAll', () => {
    it('should return all features', async () => {
      mockRepository.find.mockResolvedValue([mockFeature]);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({ relations: ['product'] });
      expect(result).toEqual([mockFeature]);
    });
  });

  describe('findByProduct', () => {
    it('should return features for a specific product', async () => {
      mockRepository.find.mockResolvedValue([mockFeature]);

      const result = await service.findByProduct(mockFeature.productId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { productId: mockFeature.productId },
        relations: ['product'],
      });
      expect(result).toEqual([mockFeature]);
    });
  });

  describe('findOne', () => {
    it('should return a feature by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockFeature);

      const result = await service.findOne(mockFeature.id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: mockFeature.id }, relations: ['product'] });
      expect(result).toEqual(mockFeature);
    });

    it('should throw NotFoundException if feature not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a feature', async () => {
      mockRepository.findOne.mockResolvedValue(mockFeature);
      mockRepository.remove.mockResolvedValue(mockFeature);

      await service.remove(mockFeature.id);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockFeature);
    });
  });
});
