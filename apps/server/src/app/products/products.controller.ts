/**
 * ProductsController - REST API endpoints for Product operations.
 * 
 * Implements specifications:
 *   - .agent-alchemy/specs/frameworks/nestjs/nestjs-fundamentals.specification.md#controller-layer
 *   - .agent-alchemy/specs/frameworks/nestjs/nestjs-database-integration.specification.md#rest-controllers
 * 
 * Feature specification:
 *   - .agent-alchemy/products/alchemy-flow/features/product-feature-management/architecture/system-architecture.specification.md#api-endpoints
 *   - .agent-alchemy/products/alchemy-flow/features/product-feature-management/plan/functional-requirements.specification.md#api-surface
 * 
 * Routes:
 *   POST   /api/products         - Create product
 *   GET    /api/products         - List all products
 *   GET    /api/products/:id     - Get single product
 *   GET    /api/products/:id/progress - Get progress
 *   PATCH  /api/products/:id     - Update product
 *   DELETE /api/products/:id     - Delete product
 * 
 * @see ProductsService for business logic
 * @see ParseUUIDPipe for ID validation per security spec
 */
import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

/**
 * REST controller for Product endpoints.
 * Per: nestjs-fundamentals.specification.md#rest-controller-pattern
 */
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Create a new product.
   * POST /api/products
   * Per: functional-requirements.specification.md#create-product
   */
  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  /**
   * List all products.
   * GET /api/products
   * Per: functional-requirements.specification.md#list-products
   */
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  /**
   * Get a single product by ID.
   * GET /api/products/:id
   * Per: functional-requirements.specification.md#get-product
   */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  /**
   * Get progress for a product.
   * GET /api/products/:id/progress
   * Per: functional-requirements.specification.md#progress-tracking
   */
  @Get(':id/progress')
  getProgress(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.getProgress(id);
  }

  /**
   * Update a product.
   * PATCH /api/products/:id
   * Per: functional-requirements.specification.md#update-product
   */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  /**
   * Delete a product.
   * DELETE /api/products/:id
   * Per: functional-requirements.specification.md#delete-product
   */
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }
}
