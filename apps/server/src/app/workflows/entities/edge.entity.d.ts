import { Workflow } from './workflow.entity';
export declare class WorkflowEdge {
    id: string;
    edgeId: string;
    source: string;
    target: string;
    condition?: string;
    workflow: Workflow;
    workflowId: string;
}
