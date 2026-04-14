/**
 * ProductsService - Business logic for Product entity.
 * 
 * Implements specifications:
 *   - .agent-alchemy/specs/frameworks/nestjs/nestjs-fundamentals.specification.md#service-layer
 *   - .agent-alchemy/specs/frameworks/nestjs/nestjs-database-integration.specification.md#repository-pattern
 * 
 * Feature specification:
 *   - .agent-alchemy/products/alchemy-flow/features/product-feature-management/architecture/system-architecture.specification.md#service-layer
 *   - .agent-alchemy/products/alchemy-flow/features/product-feature-management/plan/functional-requirements.specification.md#api-endpoints
 * 
 * @see Product entity for data model
 * @see CreateProductDto, UpdateProductDto for input validation
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto, UpdateProductDto } from '../dto/product.dto';

/**
 * Service handling Product CRUD operations and business logic.
 * 
 * Methods:
 *   - create: Create new product (POST /api/products)
 *   - findAll: List all products with relations (GET /api/products)
 *   - findOne: Get single product by ID (GET /api/products/:id)
 *   - update: Update product (PATCH /api/products/:id)
 *   - remove: Delete product (DELETE /api/products/:id)
 *   - getProgress: Calculate feature completion percentage (GET /api/products/:id/progress)
 * 
 * Per: testing-strategy.specification.md#service-layer-patterns
 */
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  /**
   * Create a new product.
   * Per: functional-requirements.specification.md#create-product
   */
  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(createProductDto);
    return this.productRepository.save(product);
  }

  /**
   * Find all products with their associated features.
   * Per: functional-requirements.specification.md#list-products
   */
  async findAll(): Promise<Product[]> {
    return this.productRepository.find({ relations: ['features'] });
  }

  /**
   * Find a single product by ID, throws NotFoundException if not found.
   * Per: functional-requirements.specification.md#get-product
   * 
   * @throws NotFoundException when product doesn't exist
   */
  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['features'],
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  /**
   * Update an existing product.
   * Per: functional-requirements.specification.md#update-product
   */
  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  /**
   * Remove a product by ID. Cascade deletes associated features.
   * Per: functional-requirements.specification.md#delete-product
   * 
   * @throws NotFoundException when product doesn't exist
   */
  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }

  /**
   * Calculate progress percentage for a product.
   * Per: functional-requirements.specification.md#progress-tracking
   * 
   * Formula: (completed features / total features) * 100
   * Returns: { total, completed, percentage }
   */
  async getProgress(id: string): Promise<{ total: number; completed: number; percentage: number }> {
    const product = await this.findOne(id);
    const total = product.features.length;
    const completed = product.features.filter(f => f.status === 'Done').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  }
}
