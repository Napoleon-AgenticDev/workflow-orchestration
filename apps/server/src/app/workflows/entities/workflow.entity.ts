import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { WorkflowNode } from './node.entity';
import { WorkflowEdge } from './edge.entity';

@Entity()
@Index('IDX_workflow_name', ['name'])
@Index('IDX_workflow_updated_at', ['updatedAt'])
@Index('IDX_workflow_created_at', ['createdAt'])
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
  @Index('IDX_workflow_metadata_status', { synchronize: false })
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