import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsOrder, FindOptionsWhere } from 'typeorm';
import { Workflow } from './entities/workflow.entity';
import { WorkflowNode } from './entities/node.entity';
import { WorkflowEdge } from './entities/edge.entity';
import { CreateWorkflowDto, UpdateWorkflowDto, WorkflowNodesDto } from './dto/workflow.dto';

export interface WorkflowQueryParams {
  search?: string;
  status?: 'active' | 'draft' | 'paused';
  sortBy?: 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'status';
  limit?: number;
  offset?: number;
}

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

  async findAll(params?: WorkflowQueryParams): Promise<{ data: Workflow[]; total: number }> {
    const { search, status, sortBy, limit = 50, offset = 0 } = params || {};

    // Build where conditions
    const where: FindOptionsWhere<Workflow> = {};
    
    if (status) {
      where.metadata = Like(`%${status}%`);
    }

    // Validate sortBy
    const validSortOptions = ['newest', 'oldest', 'name-asc', 'name-desc', 'status'];
    if (sortBy && !validSortOptions.includes(sortBy)) {
      throw new BadRequestException(`Invalid sortBy value. Valid options: ${validSortOptions.join(', ')}`);
    }

    // Build order
    const order: FindOptionsOrder<Workflow> = {};
    switch (sortBy) {
      case 'newest':
        order.updatedAt = 'DESC';
        break;
      case 'oldest':
        order.updatedAt = 'ASC';
        break;
      case 'name-asc':
        order.name = 'ASC';
        break;
      case 'name-desc':
        order.name = 'DESC';
        break;
      case 'status':
        order.metadata = 'ASC';
        break;
      default:
        order.updatedAt = 'DESC';
    }

    // Execute query
    const [data, total] = await this.workflowRepo.findAndCount({
      where,
      relations: ['nodes', 'edges'],
      order,
      take: limit,
      skip: offset,
    });

    // Apply search filter in memory (for JSON column search)
    let filteredData = data;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredData = data.filter(wf => 
        wf.name.toLowerCase().includes(searchLower) ||
        wf.description?.toLowerCase().includes(searchLower) ||
        wf.metadata?.tags?.some(t => t.toLowerCase().includes(searchLower))
      );
    }

    // Apply status filter for JSON column
    if (status) {
      filteredData = filteredData.filter(wf => wf.metadata?.status === status);
    }

    return { data: filteredData, total };
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
    // Validate trigger type
    const validTriggerTypes = ['manual', 'cron', 'webhook', 'event'];
    if (dto.trigger && !validTriggerTypes.includes(dto.trigger.type)) {
      throw new BadRequestException(`Invalid trigger type. Valid options: ${validTriggerTypes.join(', ')}`);
    }

    // Validate status
    const validStatuses = ['draft', 'active', 'paused'];
    const status = dto.metadata?.status || 'draft';
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status. Valid options: ${validStatuses.join(', ')}`);
    }

    const workflow = this.workflowRepo.create({
      ...dto,
      metadata: dto.metadata || { status: 'draft' },
    });
    return this.workflowRepo.save(workflow);
  }

  async update(id: string, dto: UpdateWorkflowDto): Promise<Workflow> {
    await this.findOne(id);

    // Validate trigger type if provided
    if (dto.trigger) {
      const validTriggerTypes = ['manual', 'cron', 'webhook', 'event'];
      if (!validTriggerTypes.includes(dto.trigger.type)) {
        throw new BadRequestException(`Invalid trigger type. Valid options: ${validTriggerTypes.join(', ')}`);
      }
    }

    // Validate status if provided
    if (dto.metadata?.status) {
      const validStatuses = ['draft', 'active', 'paused'];
      if (!validStatuses.includes(dto.metadata.status)) {
        throw new BadRequestException(`Invalid status. Valid options: ${validStatuses.join(', ')}`);
      }
    }

    await this.workflowRepo.update(id, dto as Partial<Workflow>);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.findOne(id);
    await this.workflowRepo.delete(id);
  }

  async updateNodes(workflowId: string, dto: WorkflowNodesDto): Promise<Workflow> {
    await this.findOne(workflowId);

    // Validate nodes
    if (!dto.nodes || dto.nodes.length === 0) {
      throw new BadRequestException('At least one node is required');
    }

    // Validate edges reference valid nodes
    const nodeIds = new Set(dto.nodes.map(n => n.nodeId));
    for (const edge of dto.edges) {
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
        throw new BadRequestException(`Invalid edge: source or target node does not exist`);
      }
    }
    
    await this.nodeRepo.delete({ workflowId });
    await this.edgeRepo.delete({ workflowId });

    const nodes = dto.nodes.map(n => this.nodeRepo.create({
      nodeId: n.nodeId,
      type: n.type as WorkflowNode['type'],
      positionX: n.positionX,
      positionY: n.positionY,
      data: n.data,
      workflowId,
    }));
    const edges = dto.edges.map(e => this.edgeRepo.create({
      edgeId: e.edgeId,
      source: e.source,
      target: e.target,
      condition: e.condition,
      workflowId,
    }));

    await this.nodeRepo.save(nodes);
    await this.edgeRepo.save(edges);

    return this.findOne(workflowId);
  }
}
