import { Workflow } from './workflow.entity';
export declare class WorkflowNode {
    id: string;
    nodeId: string;
    type: 'agent' | 'skill' | 'api' | 'condition' | 'transform' | 'delay';
    positionX: number;
    positionY: number;
    data: Record<string, any>;
    workflow: Workflow;
    workflowId: string;
}
