import { WorkflowsService } from './workflows.service';
import { CreateWorkflowDto, UpdateWorkflowDto, WorkflowNodesDto } from './dto/workflow.dto';
export declare class WorkflowsController {
    private readonly workflowsService;
    constructor(workflowsService: WorkflowsService);
    findAll(): Promise<import("./entities/workflow.entity").Workflow[]>;
    findOne(id: string): Promise<import("./entities/workflow.entity").Workflow>;
    create(dto: CreateWorkflowDto): Promise<import("./entities/workflow.entity").Workflow>;
    update(id: string, dto: UpdateWorkflowDto): Promise<import("./entities/workflow.entity").Workflow>;
    delete(id: string): Promise<void>;
    updateNodes(id: string, dto: WorkflowNodesDto): Promise<import("./entities/workflow.entity").Workflow>;
}
