import { WorkflowNode } from './node.entity';
import { WorkflowEdge } from './edge.entity';
export declare class Workflow {
    id: string;
    name: string;
    description?: string;
    version: string;
    trigger: {
        type: 'cron' | 'webhook' | 'manual' | 'event';
        config: Record<string, any>;
    };
    metadata?: {
        author?: string;
        tags?: string[];
        status: 'draft' | 'active' | 'paused';
    };
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    createdAt: Date;
    updatedAt: Date;
}
