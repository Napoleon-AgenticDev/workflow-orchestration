import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Execution } from './execution.entity';

export enum NodeExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

@Entity()
export class ExecutionNode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  executionId: string;

  @ManyToOne(() => Execution, execution => execution.nodes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'executionId' })
  execution: Execution;

  @Column()
  nodeId: string;

  @Column({ type: 'enum', enum: NodeExecutionStatus, default: NodeExecutionStatus.PENDING })
  status: NodeExecutionStatus;

  @Column({ type: 'jsonb', nullable: true })
  input: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  output: Record<string, any>;

  @Column({ nullable: true })
  error: string;

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;
}