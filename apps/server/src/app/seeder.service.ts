import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workflow } from './workflows/entities/workflow.entity';
import { WorkflowNode } from './workflows/entities/node.entity';
import { WorkflowEdge } from './workflows/entities/edge.entity';

const marketingAlchemyWorkflow = {
  name: 'Marketing Alchemy Daily Campaign',
  description: 'Daily automated marketing workflow: research → content creation → video generation → social publishing → analytics',
  version: '1.0.0',
  trigger: {
    type: 'cron',
    config: {
      cron: '0 8 * * *',
      timezone: 'America/Denver'
    }
  },
  metadata: {
    status: 'active' as const,
    author: 'Alchemy Flow',
    tags: ['marketing', 'automation', 'daily']
  },
  nodes: [
    {
      nodeId: 'research',
      type: 'skill' as const,
      positionX: 100,
      positionY: 200,
      data: { name: 'Content Research', skill: 'marketing-engine', action: 'research', params: { topics: ['AI agents', 'developer tools'], sources: ['github', 'twitter'] } }
    },
    {
      nodeId: 'create-content',
      type: 'skill' as const,
      positionX: 300,
      positionY: 200,
      data: { name: 'Create Blog Content', skill: 'marketing-engine', action: 'create-content', params: { type: 'blog' } }
    },
    {
      nodeId: 'audio',
      type: 'skill' as const,
      positionX: 500,
      positionY: 100,
      data: { name: 'Generate Audio', skill: 'elevenlabs', action: 'text-to-speech', params: { voice: 'professional' } }
    },
    {
      nodeId: 'video',
      type: 'skill' as const,
      positionX: 700,
      positionY: 100,
      data: { name: 'Generate Video', skill: 'elevenlabs-video-generator', action: 'create-video', params: { style: 'marketing' } }
    },
    {
      nodeId: 'linkedin',
      type: 'skill' as const,
      positionX: 500,
      positionY: 300,
      data: { name: 'Post to LinkedIn', skill: 'marketing-engine', action: 'publish-social', params: { platform: 'linkedin' } }
    },
    {
      nodeId: 'twitter',
      type: 'skill' as const,
      positionX: 700,
      positionY: 300,
      data: { name: 'Post to Twitter', skill: 'marketing-engine', action: 'publish-social', params: { platform: 'twitter' } }
    },
    {
      nodeId: 'analytics',
      type: 'api' as const,
      positionX: 900,
      positionY: 200,
      data: { name: 'Track Analytics', method: 'POST', url: '/api/analytics/track' }
    },
    {
      nodeId: 'approval-check',
      type: 'condition' as const,
      positionX: 900,
      positionY: 100,
      data: { name: 'High Priority?', conditionType: 'if', expression: 'data.priority === "high"' }
    }
  ],
  edges: [
    { edgeId: 'e1', source: 'research', target: 'create-content' },
    { edgeId: 'e2', source: 'create-content', target: 'audio' },
    { edgeId: 'e3', source: 'create-content', target: 'approval-check' },
    { edgeId: 'e4', source: 'audio', target: 'video' },
    { edgeId: 'e5', source: 'video', target: 'linkedin' },
    { edgeId: 'e6', source: 'video', target: 'twitter' },
    { edgeId: 'e7', source: 'linkedin', target: 'analytics' },
    { edgeId: 'e8', source: 'twitter', target: 'analytics' },
    { edgeId: 'e9', source: 'approval-check', target: 'video', condition: 'true' },
    { edgeId: 'e10', source: 'approval-check', target: 'linkedin', condition: 'false' }
  ]
};

@Injectable()
export class SeederService implements OnModuleInit {
  constructor(
    @InjectRepository(Workflow)
    private workflowRepo: Repository<Workflow>,
    @InjectRepository(WorkflowNode)
    private nodeRepo: Repository<WorkflowNode>,
    @InjectRepository(WorkflowEdge)
    private edgeRepo: Repository<WorkflowEdge>,
  ) {}

  async onModuleInit() {
    const existing = await this.workflowRepo.findOne({ where: { name: 'Marketing Alchemy Daily Campaign' } });
    if (existing) {
      console.log('Marketing Alchemy workflow already exists');
      return;
    }

    const workflow = this.workflowRepo.create({
      name: marketingAlchemyWorkflow.name,
      description: marketingAlchemyWorkflow.description,
      version: marketingAlchemyWorkflow.version,
      trigger: marketingAlchemyWorkflow.trigger as any,
      metadata: marketingAlchemyWorkflow.metadata as any,
    });
    const savedWorkflow = await this.workflowRepo.save(workflow);

    const nodes = marketingAlchemyWorkflow.nodes.map(n => this.nodeRepo.create({
      ...n,
      workflowId: savedWorkflow.id,
    }));
    await this.nodeRepo.save(nodes);

    const edges = marketingAlchemyWorkflow.edges.map(e => this.edgeRepo.create({
      ...e,
      workflowId: savedWorkflow.id,
    }));
    await this.edgeRepo.save(edges);

    console.log('✓ Seeded Marketing Alchemy workflow');
  }
}