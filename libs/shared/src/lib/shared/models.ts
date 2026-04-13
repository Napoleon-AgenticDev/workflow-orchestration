export interface Workflow {
  id: string;
  name: string;
  description?: string;
  version: string;
  trigger: {
    type: 'cron' | 'webhook' | 'manual' | 'event';
    config: Record<string, any>;
  };
  metadata: {
    author?: string;
    tags?: string[];
    status: 'draft' | 'active' | 'paused';
  };
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowNode {
  id: string;
  nodeId: string;
  type: 'agent' | 'skill' | 'api' | 'condition' | 'transform' | 'delay';
  positionX: number;
  positionY: number;
  data: Record<string, any>;
}

export interface WorkflowEdge {
  id: string;
  edgeId: string;
  source: string;
  target: string;
  condition?: string;
}

export interface Execution {
  id: string;
  workflowId: string;
  workflow?: Workflow;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  nodes?: ExecutionNode[];
}

export interface ExecutionNode {
  id: string;
  nodeId: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface Schedule {
  id: string;
  workflowId: string;
  workflow?: Workflow;
  name: string;
  cronExpression: string;
  timezone: string;
  enabled: boolean;
  config?: Record<string, any>;
  lastRunAt?: string;
  nextRunAt?: string;
  createdAt: string;
}

export interface CreateWorkflowDto {
  name: string;
  description?: string;
  version?: string;
  trigger: { type: string; config: Record<string, any> };
  metadata?: { status: 'draft' | 'active' | 'paused' };
}

export interface UpdateWorkflowDto {
  name?: string;
  description?: string;
  trigger?: { type: string; config: Record<string, any> };
  metadata?: { status: 'draft' | 'active' | 'paused' };
}

export interface WorkflowNodesDto {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface CreateScheduleDto {
  workflowId: string;
  name: string;
  cronExpression: string;
  timezone?: string;
  enabled?: boolean;
  config?: Record<string, any>;
}