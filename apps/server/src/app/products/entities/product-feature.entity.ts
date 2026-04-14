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
