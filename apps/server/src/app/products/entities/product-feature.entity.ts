/**
 * ProductFeature entity implementing TypeORM relationship patterns.
 * 
 * Implements specifications:
 *   - .agent-alchemy/specs/frameworks/nestjs/nestjs-database-integration.specification.md#entity-relationships
 *   - .agent-alchemy/specs/frameworks/nestjs/nestjs-fundamentals.specification.md#many-to-one
 * 
 * Feature specification:
 *   - .agent-alchemy/products/alchemy-flow/features/product-feature-management/architecture/system-architecture.specification.md#database-schema
 *   - .agent-alchemy/products/alchemy-flow/features/product-feature-management/plan/functional-requirements.specification.md#feature-entity
 * 
 * @see Product for the many-to-one relationship
 * @see FeatureStatus for valid status values
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './product.entity';

/**
 * Feature status enumeration.
 * Per: .agent-alchemy/specs/stack/angular/business-rules.md#status-enums
 */
export enum FeatureStatus {
  TODO = 'Todo',
  IN_PROGRESS = 'In Progress',
  DONE = 'Done',
}

/**
 * ProductFeature entity representing a feature belonging to a product.
 * 
 * Schema per architecture spec:
 *   - id: UUID primary key
 *   - name: Required string
 *   - description: Optional text
 *   - status: VARCHAR with enum values (Todo, In Progress, Done)
 *   - productId: Foreign key to Product
 *   - metadata: JSONB for flexible attributes
 *   - createdAt/updatedAt: Timestamps
 *   - product: ManyToOne relationship to Product
 */
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

  /**
   * Many-to-one relationship to Product.
   * Cascade delete on: system-architecture.specification.md#cascading
   */
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
