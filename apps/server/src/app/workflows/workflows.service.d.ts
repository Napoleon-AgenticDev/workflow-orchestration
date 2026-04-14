import { Repository } from 'typeorm';
import { Workflow } from './entities/workflow.entity';
import { WorkflowNode } from './entities/node.entity';
import { WorkflowEdge } from './entities/edge.entity';
import { CreateWorkflowDto, UpdateWorkflowDto, WorkflowNodesDto } from './dto/workflow.dto';
export declare class WorkflowsService {
    private workflowRepo;
    private nodeRepo;
    private edgeRepo;
    constructor(workflowRepo: Repository<Workflow>, nodeRepo: Repository<WorkflowNode>, edgeRepo: Repository<WorkflowEdge>);
    findAll(): Promise<Workflow[]>;
    findOne(id: string): Promise<Workflow>;
    create(dto: CreateWorkflowDto): Promise<Workflow>;
    update(id: string, dto: UpdateWorkflowDto): Promise<Workflow>;
    delete(id: string): Promise<void>;
    updateNodes(workflowId: string, dto: WorkflowNodesDto): Promise<Workflow>;
}
