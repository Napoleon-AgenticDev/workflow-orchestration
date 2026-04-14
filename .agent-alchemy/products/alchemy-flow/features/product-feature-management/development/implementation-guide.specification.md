# Implementation Guide: Product & Feature Management

## Phase 1: Backend Entity Setup

### Step 1.1: Create Product Entity

Location: `apps/server/src/app/products/entities/product.entity.ts`

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ProductFeature } from './product-feature.entity';

export enum ProductStatus {
  PLANNING = 'Planning',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
}

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'varchar', default: ProductStatus.PLANNING })
  status!: ProductStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    owner?: string;
    team?: string;
    priority?: 'low' | 'medium' | 'high';
  };

  @OneToMany(() => ProductFeature, feature => feature.product, { cascade: true })
  features!: ProductFeature[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

### Step 1.2: Create ProductFeature Entity

Location: `apps/server/src/app/products/entities/product-feature.entity.ts`

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './product.entity';

export enum FeatureStatus {
  TODO = 'Todo',
  IN_PROGRESS = 'In Progress',
  DONE = 'Done',
}

@Entity()
export class ProductFeature {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'varchar', default: FeatureStatus.TODO })
  status!: FeatureStatus;

  @Column({ nullable: true })
  productId!: string;

  @ManyToOne(() => Product, product => product.features, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    assignee?: string;
    priority?: 'low' | 'medium' | 'high';
    storyPoints?: number;
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

## Phase 2: DTOs

### Step 2.1: Product DTOs

Location: `apps/server/src/app/products/dto/product.dto.ts`

```typescript
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ProductStatus } from '../entities/product.entity';

export class CreateProductDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  metadata?: { owner?: string; team?: string; priority?: 'low' | 'medium' | 'high' };
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  metadata?: { owner?: string; team?: string; priority?: 'low' | 'medium' | 'high' };
}
```

### Step 2.2: Feature DTOs

Location: `apps/server/src/app/features/dto/feature.dto.ts`

```typescript
import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { FeatureStatus } from '../entities/product-feature.entity';

export class CreateFeatureDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(FeatureStatus)
  status?: FeatureStatus;

  @IsUUID()
  productId!: string;

  @IsOptional()
  metadata?: { assignee?: string; priority?: 'low' | 'medium' | 'high'; storyPoints?: number };
}

export class UpdateFeatureDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(FeatureStatus)
  status?: FeatureStatus;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  metadata?: { assignee?: string; priority?: 'low' | 'medium' | 'high'; storyPoints?: number };
}
```

## Phase 3: Services

### Step 3.1: ProductsService

Location: `apps/server/src/app/products/products.service.ts`

Key methods:
- `create(createProductDto)`: Create new product
- `findAll()`: Return all products with relations
- `findOne(id)`: Return single product with NotFoundException
- `update(id, dto)`: Update product
- `remove(id)`: Delete product
- `getProgress(id)`: Calculate progress percentage

### Step 3.2: FeaturesService

Location: `apps/server/src/app/features/features.service.ts`

Key methods:
- `create(createFeatureDto)`: Create new feature
- `findAll()`: Return all features
- `findByProduct(productId)`: Get features for product
- `findOne(id)`: Return single feature with NotFoundException
- `update(id, dto)`: Update feature
- `remove(id)`: Delete feature

## Phase 4: Controllers

### Step 4.1: ProductsController

Location: `apps/server/src/app/products/products.controller.ts`

Endpoints:
- POST /products - Create
- GET /products - List all
- GET /products/:id - Get one
- GET /products/:id/progress - Get progress
- PATCH /products/:id - Update
- DELETE /products/:id - Delete

### Step 4.2: FeaturesController

Location: `apps/server/src/app/features/features.controller.ts`

Endpoints:
- POST /features - Create
- GET /features - List all
- GET /features/product/:productId - By product
- GET /features/:id - Get one
- PATCH /features/:id - Update
- DELETE /features/:id - Delete

## Phase 5: Module Registration

Add entities to TypeORM config and import modules in AppModule.

## Phase 6: Frontend

### Step 6.1: ApiService Extension

Add methods for Products and Features.

### Step 6.2: ProductsComponent

Create component with:
- Grid display of products
- Create form
- Feature modal
- Progress calculation

## Phase 7: Testing

### Unit Tests Required

1. ProductsService - all methods
2. FeaturesService - all methods
3. Coverage target: 80%+

---

## Implementation Notes

- Use UUID primary keys with ParseUUIDPipe
- Enable cascade delete for features when product deleted
- Return relations (features) in product queries
- Calculate progress: (completed features / total features) * 100
