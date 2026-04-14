import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductFeature } from '../entities/product-feature.entity';
import { CreateFeatureDto, UpdateFeatureDto } from '../dto/feature.dto';

@Injectable()
export class FeaturesService {
  constructor(
    @InjectRepository(ProductFeature)
    private readonly featureRepository: Repository<ProductFeature>,
  ) {}

  async create(createFeatureDto: CreateFeatureDto): Promise<ProductFeature> {
    const feature = this.featureRepository.create(createFeatureDto);
    return this.featureRepository.save(feature);
  }

  async findAll(): Promise<ProductFeature[]> {
    return this.featureRepository.find({ relations: ['product'] });
  }

  async findByProduct(productId: string): Promise<ProductFeature[]> {
    return this.featureRepository.find({
      where: { productId },
      relations: ['product'],
    });
  }

  async findOne(id: string): Promise<ProductFeature> {
    const feature = await this.featureRepository.findOne({
      where: { id },
      relations: ['product'],
    });
    if (!feature) {
      throw new NotFoundException(`Feature with ID ${id} not found`);
    }
    return feature;
  }

  async update(id: string, updateFeatureDto: UpdateFeatureDto): Promise<ProductFeature> {
    const feature = await this.findOne(id);
    Object.assign(feature, updateFeatureDto);
    return this.featureRepository.save(feature);
  }

  async remove(id: string): Promise<void> {
    const feature = await this.findOne(id);
    await this.featureRepository.remove(feature);
  }
}
