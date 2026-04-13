import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { WorkflowNode } from './node.entity';
import { WorkflowEdge } from './edge.entity';

@Entity()
export class Workflow {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: '1.0.0' })
  version!: string;

  @Column({ type: 'jsonb' })
  trigger!: {
    type: 'cron' | 'webhook' | 'manual' | 'event';
    config: Record<string, any>;
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    author?: string;
    tags?: string[];
    status: 'draft' | 'active' | 'paused';
  };

  @OneToMany(() => WorkflowNode, node => node.workflow, { cascade: true })
  nodes!: WorkflowNode[];

  @OneToMany(() => WorkflowEdge, edge => edge.workflow, { cascade: true })
  edges!: WorkflowEdge[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}