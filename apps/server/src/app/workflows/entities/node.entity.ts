import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Workflow } from './workflow.entity';

@Entity()
export class WorkflowNode {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  nodeId!: string;

  @Column()
  type!: 'agent' | 'skill' | 'api' | 'condition' | 'transform' | 'delay';

  @Column({ type: 'float' })
  positionX!: number;

  @Column({ type: 'float' })
  positionY!: number;

  @Column({ type: 'jsonb' })
  data!: Record<string, any>;

  @ManyToOne(() => Workflow, workflow => workflow.nodes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflowId' })
  workflow!: Workflow;

  @Column()
  workflowId!: string;
}