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
