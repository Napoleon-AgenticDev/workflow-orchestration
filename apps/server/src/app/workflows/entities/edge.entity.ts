import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Workflow } from './workflow.entity';

@Entity()
export class WorkflowEdge {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  edgeId!: string;

  @Column()
  source!: string;

  @Column()
  target!: string;

  @Column({ nullable: true })
  condition?: string;

  @ManyToOne(() => Workflow, workflow => workflow.edges, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflowId' })
  workflow!: Workflow;

  @Column()
  workflowId!: string;
}