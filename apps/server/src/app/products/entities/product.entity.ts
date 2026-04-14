/**
 * Product entity implementing TypeORM patterns for PostgreSQL.
 * 
 * Implements specifications:
 *   - .agent-alchemy/specs/frameworks/nestjs/nestjs-database-integration.specification.md#entity-definitions
 *   - .agent-alchemy/specs/stack/stack.json#primary-key-strategy
 *   - .agent-alchemy/specs/frameworks/nestjs/nestjs-fundamentals.specification.md#entity-decorators
 * 
 * Feature specification:
 *   - .agent-alchemy/products/alchemy-flow/features/product-feature-management/architecture/system-architecture.specification.md#database-schema
 *   - .agent-alchemy/products/alchemy-flow/features/product-feature-management/plan/functional-requirements.specification.md#product-entity
 * 
 * @see ProductFeature for one-to-many relationship
 * @see ProductStatus for valid status values
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ProductFeature } from './product-feature.entity';

/**
 * Product status enumeration.
 * Per: .agent-alchemy/specs/stack/angular/business-rules.md#status-enums
 */
export enum ProductStatus {
  PLANNING = 'Planning',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
}

/**
 * Product entity representing a product in the system.
 * 
 * Schema per architecture spec:
 *   - id: UUID primary key
 *   - name: Required string
 *   - description: Optional text
 *   - status: VARCHAR with enum values (Planning, In Progress, Completed)
 *   - metadata: JSONB for flexible attributes
 *   - createdAt/updatedAt: Timestamps
 *   - features: OneToMany relationship to ProductFeature
 */
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

  /**
   * One-to-many relationship with ProductFeature.
   * Cascade delete enabled per: system-architecture.specification.md#cascading
   */
  @OneToMany(() => ProductFeature, feature => feature.product, { cascade: true })
  features!: ProductFeature[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
