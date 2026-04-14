import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { Workflow, Execution, Schedule, CreateWorkflowDto } from '@alchemy-flow/shared';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  const mockWorkflow: Workflow = {
    id: 'wf-123',
    name: 'Test Workflow',
    description: 'Test',
    version: '1.0.0',
    trigger: { type: 'manual', config: {} },
    metadata: { status: 'draft' },
    nodes: [],
    edges: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockExecution: Execution = {
    id: 'exec-123',
    workflowId: 'wf-123',
    status: 'success',
    input: {},
    output: {},
    createdAt: new Date().toISOString(),
  };

  const mockSchedule: Schedule = {
    id: 'sched-123',
    workflowId: 'wf-123',
    name: 'Daily',
    cronExpression: '0 8 * * *',
    timezone: 'America/Denver',
    enabled: true,
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService],
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Workflows', () => {
    describe('getWorkflows', () => {
      it('should return all workflows', () => {
        const workflows = [mockWorkflow];
        service.getWorkflows().subscribe((data) => {
          expect(data).toEqual(workflows);
        });

        const req = httpMock.expectOne('http://localhost:3000/api/workflows');
        expect(req.request.method).toBe('GET');
        req.flush(workflows);
      });

      it('should return empty array when no workflows', () => {
        service.getWorkflows().subscribe((data) => {
          expect(data).toEqual([]);
        });

        const req = httpMock.expectOne('http://localhost:3000/api/workflows');
        req.flush([]);
      });

      it('should pass search query param', () => {
        service.getWorkflows({ search: 'test' }).subscribe();

        const req = httpMock.expectOne('http://localhost:3000/api/workflows?search=test');
        expect(req.request.params.get('search')).toBe('test');
      });

      it('should pass status filter query param', () => {
        service.getWorkflows({ status: 'active' }).subscribe();

        const req = httpMock.expectOne('http://localhost:3000/api/workflows?status=active');
        expect(req.request.params.get('status')).toBe('active');
      });

      it('should pass sortBy query param', () => {
        service.getWorkflows({ sortBy: 'name-asc' }).subscribe();

        const req = httpMock.expectOne('http://localhost:3000/api/workflows?sortBy=name-asc');
        expect(req.request.params.get('sortBy')).toBe('name-asc');
      });

      it('should pass limit and offset query params', () => {
        service.getWorkflows({ limit: 10, offset: 5 }).subscribe();

        const req = httpMock.expectOne('http://localhost:3000/api/workflows?limit=10&offset=5');
        expect(req.request.params.get('limit')).toBe('10');
        expect(req.request.params.get('offset')).toBe('5');
      });

      it('should combine multiple query params', () => {
        service.getWorkflows({ search: 'marketing', status: 'active', sortBy: 'newest' }).subscribe();

        const req = httpMock.expectOne('http://localhost:3000/api/workflows?search=marketing&status=active&sortBy=newest');
        expect(req.request.method).toBe('GET');
      });
    });

    describe('getWorkflow', () => {
      it('should return single workflow by id', () => {
        service.getWorkflow('wf-123').subscribe((data) => {
          expect(data).toEqual(mockWorkflow);
        });

        const req = httpMock.expectOne('http://localhost:3000/api/workflows/wf-123');
        expect(req.request.method).toBe('GET');
        req.flush(mockWorkflow);
      });
    });

    describe('createWorkflow', () => {
      it('should create workflow with correct payload', () => {
        const dto: CreateWorkflowDto = {
          name: 'New Workflow',
          trigger: { type: 'manual', config: {} },
        };

        service.createWorkflow(dto).subscribe((data) => {
          expect(data).toEqual(mockWorkflow);
        });

        const req = httpMock.expectOne('http://localhost:3000/api/workflows');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(dto);
        req.flush(mockWorkflow);
      });
    });

    describe('updateWorkflow', () => {
      it('should update workflow with correct payload', () => {
        const updates = { name: 'Updated Name' };

        service.updateWorkflow('wf-123', updates).subscribe((data) => {
          expect(data).toEqual(mockWorkflow);
        });

        const req = httpMock.expectOne('http://localhost:3000/api/workflows/wf-123');
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual(updates);
        req.flush(mockWorkflow);
      });
    });

    describe('deleteWorkflow', () => {
      it('should delete workflow', () => {
        service.deleteWorkflow('wf-123').subscribe();

        const req = httpMock.expectOne('http://localhost:3000/api/workflows/wf-123');
        expect(req.request.method).toBe('DELETE');
        req.flush(null);
      });
    });

    describe('updateWorkflowNodes', () => {
      it('should update nodes and edges', () => {
        const nodes = [
          { id: 'node-1', nodeId: 'node_1', type: 'skill' as const, positionX: 100, positionY: 100, data: {} },
        ];
        const edges = [
          { id: 'edge-1', edgeId: 'edge_1', source: 'node-1', target: 'node-2' },
        ];

        service.updateWorkflowNodes('wf-123', nodes, edges).subscribe((data) => {
          expect(data).toEqual(mockWorkflow);
        });

        const req = httpMock.expectOne('http://localhost:3000/api/workflows/wf-123/nodes');
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({ nodes, edges });
        req.flush(mockWorkflow);
      });
    });
  });

  describe('Executions', () => {
    describe('getExecutions', () => {
      it('should return all executions', () => {
        const executions = [mockExecution];
        service.getExecutions().subscribe((data) => {
          expect(data).toEqual(executions);
        });

        const req = httpMock.expectOne('http://localhost:3000/api/executions');
        expect(req.request.method).toBe('GET');
        req.flush(executions);
      });

      it('should filter executions by workflowId', () => {
        const executions = [mockExecution];
        service.getExecutions('wf-123').subscribe((data) => {
          expect(data).toEqual(executions);
        });

        const req = httpMock.expectOne('http://localhost:3000/api/executions?workflowId=wf-123');
        expect(req.request.method).toBe('GET');
        req.flush(executions);
      });
    });

    describe('getExecution', () => {
      it('should return single execution', () => {
        service.getExecution('exec-123').subscribe((data) => {
          expect(data).toEqual(mockExecution);
        });

        const req = httpMock.expectOne('http://localhost:3000/api/executions/exec-123');
        expect(req.request.method).toBe('GET');
        req.flush(mockExecution);
      });
    });

    describe('executeWorkflow', () => {
      it('should execute workflow without input', () => {
        service.executeWorkflow('wf-123').subscribe((data) => {
          expect(data).toEqual(mockExecution);
        });

        const req = httpMock.expectOne('http://localhost:3000/api/executions/execute');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ workflowId: 'wf-123', input: undefined });
        req.flush(mockExecution);
      });

      it('should execute workflow with custom input', () => {
        const input = { userId: 'user-1', params: { limit: 10 } };

        service.executeWorkflow('wf-123', input).subscribe((data) => {
          expect(data).toEqual(mockExecution);
        });

        const req = httpMock.expectOne('http://localhost:3000/api/executions/execute');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ workflowId: 'wf-123', input });
        req.flush(mockExecution);
      });
    });
  });

  describe('Schedules', () => {
    describe('getSchedules', () => {
      it('should return all schedules', () => {
        const schedules = [mockSchedule];
        service.getSchedules().subscribe((data) => {
          expect(data).toEqual(schedules);
        });

        const req = httpMock.expectOne('http://localhost:3000/api/schedules');
        expect(req.request.method).toBe('GET');
        req.flush(schedules);
      });
    });

    describe('getSchedule', () => {
      it('should return single schedule', () => {
        service.getSchedule('sched-123').subscribe((data) => {
          expect(data).toEqual(mockSchedule);
        });

        const req = httpMock.expectOne('http://localhost:3000/api/schedules/sched-123');
        expect(req.request.method).toBe('GET');
        req.flush(mockSchedule);
      });
    });

    describe('createSchedule', () => {
      it('should create schedule', () => {
        const dto = {
          workflowId: 'wf-123',
          name: 'New Schedule',
          cronExpression: '0 9 * * *',
        };

        service.createSchedule(dto).subscribe((data) => {
          expect(data).toEqual(mockSchedule);
        });

        const req = httpMock.expectOne('http://localhost:3000/api/schedules');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(dto);
        req.flush(mockSchedule);
      });
    });

    describe('updateSchedule', () => {
      it('should update schedule', () => {
        const updates = { name: 'Updated Schedule', enabled: false };

        service.updateSchedule('sched-123', updates).subscribe((data) => {
          expect(data).toEqual(mockSchedule);
        });

        const req = httpMock.expectOne('http://localhost:3000/api/schedules/sched-123');
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual(updates);
        req.flush(mockSchedule);
      });
    });

    describe('deleteSchedule', () => {
      it('should delete schedule', () => {
        service.deleteSchedule('sched-123').subscribe();

        const req = httpMock.expectOne('http://localhost:3000/api/schedules/sched-123');
        expect(req.request.method).toBe('DELETE');
        req.flush(null);
      });
    });

    describe('triggerSchedule', () => {
      it('should trigger schedule', () => {
        service.triggerSchedule('sched-123').subscribe((data) => {
          expect(data).toEqual({ message: 'Triggered' });
        });

        const req = httpMock.expectOne('http://localhost:3000/api/schedules/sched-123/trigger');
        expect(req.request.method).toBe('POST');
        req.flush({ message: 'Triggered' });
      });
    });
  });

  describe('Error handling', () => {
    it('should handle HTTP errors', () => {
      service.getWorkflows().subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
        },
      });

      const req = httpMock.expectOne('http://localhost:3000/api/workflows');
      req.flush('Not found', { status: 404, statusText: 'Not found' });
    });

    it('should handle network errors', () => {
      service.getWorkflows().subscribe({
        error: (err) => {
          expect(err.type).toBeFalsy();
        },
      });

      const req = httpMock.expectOne('http://localhost:3000/api/workflows');
      req.error(new ProgressEvent('error'));
    });
  });
});
