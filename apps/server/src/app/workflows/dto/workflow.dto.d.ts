declare class TriggerDto {
    type: 'cron' | 'webhook' | 'manual' | 'event';
    config: Record<string, any>;
}
declare class MetadataDto {
    author?: string;
    tags?: string[];
    status: 'draft' | 'active' | 'paused';
}
export declare class CreateWorkflowDto {
    name: string;
    description?: string;
    version?: string;
    trigger: TriggerDto;
    metadata?: MetadataDto;
}
export declare class UpdateWorkflowDto {
    name?: string;
    description?: string;
    trigger?: {
        type: 'cron' | 'webhook' | 'manual' | 'event';
        config: Record<string, any>;
    };
    metadata?: MetadataDto;
}
export declare class NodeDto {
    nodeId: string;
    type: string;
    positionX: number;
    positionY: number;
    data: Record<string, any>;
}
export declare class EdgeDto {
    edgeId: string;
    source: string;
    target: string;
    condition?: string;
}
export declare class WorkflowNodesDto {
    nodes: NodeDto[];
    edges: EdgeDto[];
}
export {};
