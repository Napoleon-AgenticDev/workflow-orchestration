import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Workflow } from '../../workflows/entities/workflow.entity';
import { ExecutionNode } from './execution-node.entity';

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity()
export class Execution {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  workflowId!: string;

  @ManyToOne(() => Workflow)
  @JoinColumn({ name: 'workflowId' })
  workflow!: Workflow;

  @OneToMany(() => ExecutionNode, node => node.execution, { cascade: true })
  nodes!: ExecutionNode[];

  @Column({ type: 'enum', enum: ExecutionStatus, default: ExecutionStatus.PENDING })
  status!: ExecutionStatus;

  @Column({ type: 'jsonb', nullable: true })
  input?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  output?: Record<string, any>;

  @Column({ nullable: true })
  error?: string;

  @Column({ nullable: true })
  startedAt?: Date;

  @Column({ nullable: true })
  completedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}