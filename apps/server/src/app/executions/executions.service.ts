import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Execution, ExecutionStatus } from './entities/execution.entity';
import { ExecutionNode, NodeExecutionStatus } from './entities/execution-node.entity';
import { WorkflowsService } from '../workflows/workflows.service';

@Injectable()
export class ExecutionsService {
  constructor(
    @InjectRepository(Execution)
    private executionRepo: Repository<Execution>,
    @InjectRepository(ExecutionNode)
    private nodeRepo: Repository<ExecutionNode>,
    private workflowsService: WorkflowsService,
  ) {}

  async findAll(workflowId?: string): Promise<Execution[]> {
    const where = workflowId ? { workflowId } : {};
    return this.executionRepo.find({
      where,
      relations: ['workflow'],
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async findOne(id: string): Promise<Execution> {
    const execution = await this.executionRepo.findOne({
      where: { id },
      relations: ['workflow', 'nodes'],
    });
    if (!execution) {
      throw new NotFoundException(`Execution ${id} not found`);
    }
    return execution;
  }

  async execute(workflowId: string, input?: Record<string, any>): Promise<Execution> {
    const workflow = await this.workflowsService.findOne(workflowId);
    
    const execution = this.executionRepo.create({
      workflowId,
      status: ExecutionStatus.RUNNING,
      input,
      startedAt: new Date(),
    });
    await this.executionRepo.save(execution);

    try {
      const results: Record<string, any> = {};
      
      for (const node of workflow.nodes) {
        const execNode = this.nodeRepo.create({
          executionId: execution.id,
          nodeId: node.nodeId,
          status: NodeExecutionStatus.RUNNING,
          startedAt: new Date(),
        });
        await this.nodeRepo.save(execNode);

        try {
          const output = await this.executeNode(node, results);
          results[node.nodeId] = output;
          
          execNode.status = NodeExecutionStatus.SUCCESS;
          execNode.output = output;
          execNode.completedAt = new Date();
        } catch (err: unknown) {
          execNode.status = NodeExecutionStatus.FAILED;
          execNode.error = err instanceof Error ? err.message : String(err);
          execNode.completedAt = new Date();
          throw err;
        }
        await this.nodeRepo.save(execNode);
      }

      execution.status = ExecutionStatus.SUCCESS;
      execution.output = results;
      execution.completedAt = new Date();
    } catch (err: unknown) {
      execution.status = ExecutionStatus.FAILED;
      execution.error = err instanceof Error ? err.message : String(err);
      execution.completedAt = new Date();
    }

    return this.executionRepo.save(execution);
  }

  private async executeNode(node: any, context: Record<string, any>): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    switch (node.type) {
      case 'skill':
        return { skill: node.data.skill, action: node.data.action, result: 'executed' };
      case 'agent':
        return { agent: node.data.agent, result: 'executed' };
      case 'api':
        return { api: node.data.api, result: 'executed' };
      case 'delay':
        return { delay: node.data.duration, result: 'waited' };
      case 'condition':
        return { condition: node.data.condition, result: true };
      case 'transform':
        return { transform: node.data.transform, result: 'transformed' };
      default:
        return { type: node.type, result: 'executed' };
    }
  }
}