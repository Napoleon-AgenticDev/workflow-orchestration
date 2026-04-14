import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { Workflow } from './entities/workflow.entity';
import { WorkflowNode } from './entities/node.entity';
import { WorkflowEdge } from './entities/edge.entity';

describe('WorkflowsService', () => {
  let service: WorkflowsService;
  let workflowRepo: any;
  let nodeRepo: any;
  let edgeRepo: any;

  const mockWorkflow: Workflow = {
    id: 'wf-123',
    name: 'Test Workflow',
    description: 'A test workflow',
    version: '1.0.0',
    trigger: { type: 'manual', config: {} },
    metadata: { status: 'draft' },
    nodes: [
      {
        id: 'node-1',
        nodeId: 'node_1',
        type: 'skill' as any,
        positionX: 100,
        positionY: 100,
        data: { name: 'Skill Node' },
      },
    ],
    edges: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowsService,
        {
          provide: getRepositoryToken(Workflow),
          useValue: {
            find: vi.fn(),
            findOne: vi.fn(),
            create: vi.fn(),
            save: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(WorkflowNode),
          useValue: {
            create: vi.fn(),
            delete: vi.fn(),
            save: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(WorkflowEdge),
          useValue: {
            create: vi.fn(),
            delete: vi.fn(),
            save: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WorkflowsService>(WorkflowsService);
    workflowRepo = module.get(getRepositoryToken(Workflow));
    nodeRepo = module.get(getRepositoryToken(WorkflowNode));
    edgeRepo = module.get(getRepositoryToken(WorkflowEdge));
  });

  describe('findAll', () => {
    it('should return all workflows sorted by updatedAt DESC', async () => {
      const workflows = [mockWorkflow];
      workflowRepo.find.mockResolvedValue(workflows);

      const result = await service.findAll();

      expect(result).toEqual(workflows);
      expect(workflowRepo.find).toHaveBeenCalledWith({
        relations: ['nodes', 'edges'],
        order: { updatedAt: 'DESC' },
      });
    });

    it('should return empty array when no workflows exist', async () => {
      workflowRepo.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return workflow when found', async () => {
      workflowRepo.findOne.mockResolvedValue(mockWorkflow);

      const result = await service.findOne('wf-123');

      expect(result).toEqual(mockWorkflow);
      expect(workflowRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'wf-123' },
        relations: ['nodes', 'edges'],
      });
    });

    it('should throw NotFoundException when workflow not found', async () => {
      workflowRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException with correct message', async () => {
      workflowRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'Workflow nonexistent not found',
      );
    });
  });

  describe('create', () => {
    it('should create workflow with default metadata', async () => {
      const dto = { name: 'New Workflow', trigger: { type: 'manual' as const, config: {} } };
      const created = { ...mockWorkflow, ...dto };
      workflowRepo.create.mockReturnValue(created as any);
      workflowRepo.save.mockResolvedValue(created as any);

      const result = await service.create(dto as any);

      expect(workflowRepo.create).toHaveBeenCalledWith({
        ...dto,
        metadata: { status: 'draft' },
      });
      expect(workflowRepo.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
    });

    it('should create workflow with provided metadata', async () => {
      const dto = {
        name: 'New Workflow',
        trigger: { type: 'manual' as const, config: {} },
        metadata: { status: 'active' as const },
      };
      workflowRepo.create.mockReturnValue(dto as any);
      workflowRepo.save.mockResolvedValue(dto as any);

      const result = await service.create(dto as any);

      expect(workflowRepo.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(dto);
    });
  });

  describe('update', () => {
    it('should update workflow when found', async () => {
      const updateDto = { name: 'Updated Name' };
      workflowRepo.findOne.mockResolvedValue(mockWorkflow);
      workflowRepo.update.mockResolvedValue({ affected: 1 } as any);
      workflowRepo.findOne.mockResolvedValueOnce(mockWorkflow).mockResolvedValueOnce({
        ...mockWorkflow,
        name: 'Updated Name',
      } as any);

      const result = await service.update('wf-123', updateDto as any);

      expect(workflowRepo.update).toHaveBeenCalledWith('wf-123', updateDto as any);
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when updating nonexistent workflow', async () => {
      workflowRepo.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete workflow when found', async () => {
      workflowRepo.findOne.mockResolvedValue(mockWorkflow);
      workflowRepo.delete.mockResolvedValue({ affected: 1 } as any);

      await service.delete('wf-123');

      expect(workflowRepo.delete).toHaveBeenCalledWith('wf-123');
    });

    it('should throw NotFoundException when deleting nonexistent workflow', async () => {
      workflowRepo.findOne.mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateNodes', () => {
    const nodesDto = {
      nodes: [
        {
          nodeId: 'node_1',
          type: 'skill' as const,
          positionX: 100,
          positionY: 100,
          data: { name: 'Test Node' },
        },
      ],
      edges: [
        {
          edgeId: 'edge_1',
          source: 'node-1',
          target: 'node-2',
        },
      ],
    };

    it('should update nodes and edges successfully', async () => {
      workflowRepo.findOne.mockResolvedValue(mockWorkflow);
      nodeRepo.delete.mockResolvedValue({ affected: 1 } as any);
      edgeRepo.delete.mockResolvedValue({ affected: 1 } as any);
      nodeRepo.save.mockResolvedValue([]);
      edgeRepo.save.mockResolvedValue([]);
      workflowRepo.findOne.mockResolvedValue(mockWorkflow);

      const result = await service.updateNodes('wf-123', nodesDto as any);

      expect(nodeRepo.delete).toHaveBeenCalledWith({ workflowId: 'wf-123' });
      expect(edgeRepo.delete).toHaveBeenCalledWith({ workflowId: 'wf-123' });
      expect(nodeRepo.save).toHaveBeenCalled();
      expect(edgeRepo.save).toHaveBeenCalled();
      expect(workflowRepo.findOne).toHaveBeenCalledWith('wf-123');
    });

    it('should throw NotFoundException when workflow not found', async () => {
      workflowRepo.findOne.mockResolvedValue(null);

      await expect(service.updateNodes('nonexistent', nodesDto as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle empty nodes array', async () => {
      workflowRepo.findOne.mockResolvedValue(mockWorkflow);
      nodeRepo.delete.mockResolvedValue({ affected: 1 } as any);
      edgeRepo.delete.mockResolvedValue({ affected: 1 } as any);
      nodeRepo.save.mockResolvedValue([]);
      edgeRepo.save.mockResolvedValue([]);
      workflowRepo.findOne.mockResolvedValue(mockWorkflow);

      const result = await service.updateNodes('wf-123', { nodes: [], edges: [] });

      expect(nodeRepo.delete).toHaveBeenCalled();
      expect(nodeRepo.save).toHaveBeenCalledWith([]);
    });

    it('should handle empty edges array', async () => {
      workflowRepo.findOne.mockResolvedValue(mockWorkflow);
      nodeRepo.delete.mockResolvedValue({ affected: 1 } as any);
      edgeRepo.delete.mockResolvedValue({ affected: 1 } as any);
      nodeRepo.save.mockResolvedValue([]);
      edgeRepo.save.mockResolvedValue([]);
      workflowRepo.findOne.mockResolvedValue(mockWorkflow);

      const result = await service.updateNodes('wf-123', {
        nodes: nodesDto.nodes,
        edges: [],
      });

      expect(edgeRepo.save).toHaveBeenCalledWith([]);
    });

    it('should map node type correctly', async () => {
      workflowRepo.findOne.mockResolvedValue(mockWorkflow);
      nodeRepo.delete.mockResolvedValue({ affected: 1 } as any);
      edgeRepo.delete.mockResolvedValue({ affected: 1 } as any);
      nodeRepo.save.mockImplementation((nodes: any) => Promise.resolve(nodes));
      edgeRepo.save.mockResolvedValue([]);
      workflowRepo.findOne.mockResolvedValue(mockWorkflow);

      await service.updateNodes('wf-123', nodesDto as any);

      const savedNodes = nodeRepo.save.mock.calls[0][0];
      expect(savedNodes[0]).toHaveProperty('workflowId', 'wf-123');
    });

    it('should preserve edge conditions', async () => {
      const edgeWithCondition = {
        ...nodesDto.edges[0],
        condition: 'data.status === "success"',
      };
      workflowRepo.findOne.mockResolvedValue(mockWorkflow);
      nodeRepo.delete.mockResolvedValue({ affected: 1 } as any);
      edgeRepo.delete.mockResolvedValue({ affected: 1 } as any);
      nodeRepo.save.mockResolvedValue([]);
      edgeRepo.save.mockImplementation((edges: any) => Promise.resolve(edges));
      workflowRepo.findOne.mockResolvedValue(mockWorkflow);

      await service.updateNodes('wf-123', {
        nodes: nodesDto.nodes,
        edges: [edgeWithCondition],
      });

      const savedEdges = edgeRepo.save.mock.calls[0][0];
      expect(savedEdges[0]).toHaveProperty('condition', 'data.status === "success"');
    });
  });
});
