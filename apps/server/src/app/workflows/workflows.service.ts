import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workflow } from './entities/workflow.entity';
import { WorkflowNode } from './entities/node.entity';
import { WorkflowEdge } from './entities/edge.entity';
import { CreateWorkflowDto, UpdateWorkflowDto, WorkflowNodesDto } from './dto/workflow.dto';

@Injectable()
export class WorkflowsService {
  constructor(
    @InjectRepository(Workflow)
    private workflowRepo: Repository<Workflow>,
    @InjectRepository(WorkflowNode)
    private nodeRepo: Repository<WorkflowNode>,
    @InjectRepository(WorkflowEdge)
    private edgeRepo: Repository<WorkflowEdge>,
  ) {}

  async findAll(): Promise<Workflow[]> {
    return this.workflowRepo.find({
      relations: ['nodes', 'edges'],
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Workflow> {
    const workflow = await this.workflowRepo.findOne({
      where: { id },
      relations: ['nodes', 'edges'],
    });
    if (!workflow) {
      throw new NotFoundException(`Workflow ${id} not found`);
    }
    return workflow;
  }

  async create(dto: CreateWorkflowDto): Promise<Workflow> {
    const workflow = this.workflowRepo.create({
      ...dto,
      metadata: dto.metadata || { status: 'draft' },
    });
    return this.workflowRepo.save(workflow);
  }

  async update(id: string, dto: UpdateWorkflowDto): Promise<Workflow> {
    await this.findOne(id);
    await this.workflowRepo.update(id, dto);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.findOne(id);
    await this.workflowRepo.delete(id);
  }

  async updateNodes(workflowId: string, dto: WorkflowNodesDto): Promise<Workflow> {
    await this.findOne(workflowId);
    
    await this.nodeRepo.delete({ workflowId });
    await this.edgeRepo.delete({ workflowId });

    const nodes = dto.nodes.map(n => this.nodeRepo.create({
      ...n,
      workflowId,
    }));
    const edges = dto.edges.map(e => this.edgeRepo.create({
      ...e,
      workflowId,
    }));

    await this.nodeRepo.save(nodes);
    await this.edgeRepo.save(edges);

    return this.findOne(workflowId);
  }
}