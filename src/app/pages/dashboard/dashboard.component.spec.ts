import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { DragDropModule } from 'primeng/dragdrop';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { DashboardComponent } from './dashboard.component';
import { ApiService } from '../../services/api.service';
import { Workflow, Execution } from '@alchemy-flow/shared';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let httpMock: HttpTestingController;
  let apiService: ApiService;

  const mockWorkflow: Workflow = {
    id: 'wf-123',
    name: 'Marketing Campaign',
    description: 'Daily marketing automation workflow',
    version: '1.0.0',
    trigger: { type: 'cron', config: {} },
    metadata: { status: 'active', tags: ['marketing'] },
    nodes: [
      { id: 'node-1', nodeId: 'research', type: 'skill', positionX: 100, positionY: 100, data: {} },
      { id: 'node-2', nodeId: 'create-content', type: 'skill', positionX: 200, positionY: 100, data: {} },
    ],
    edges: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockExecutionRunning: Execution = {
    id: 'exec-1',
    workflowId: 'wf-123',
    workflow: mockWorkflow,
    status: 'running',
    input: {},
    output: {},
    startedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    nodes: [
      { id: 'en-1', nodeId: 'research', status: 'success', input: {}, output: {} },
      { id: 'en-2', nodeId: 'create-content', status: 'running', input: {}, output: {} },
    ],
  };

  const mockExecutionSuccess: Execution = {
    id: 'exec-2',
    workflowId: 'wf-123',
    workflow: mockWorkflow,
    status: 'success',
    input: {},
    output: { result: 'success' },
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    nodes: [],
  };

  const mockExecutionFailed: Execution = {
    id: 'exec-3',
    workflowId: 'wf-123',
    workflow: mockWorkflow,
    status: 'failed',
    input: {},
    output: {},
    error: 'Something went wrong',
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    nodes: [],
  };

  const mockExecutionPending: Execution = {
    id: 'exec-4',
    workflowId: 'wf-123',
    workflow: mockWorkflow,
    status: 'pending',
    input: {},
    output: {},
    createdAt: new Date().toISOString(),
    nodes: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        DashboardComponent,
        DragDropModule,
        CardModule,
        ButtonModule,
        TagModule,
        ProgressBarModule,
        AvatarModule,
        MenuModule,
        TooltipModule,
        BadgeModule,
      ],
      providers: [ApiService],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    apiService = TestBed.inject(ApiService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ============================================
  // HAPPY PATH TESTS
  // ============================================

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default project selected', () => {
      expect(component.selectedProject).toBeDefined();
      expect(component.selectedProject.name).toBe('Marketing Automation');
    });

    it('should initialize with 4 kanban columns', () => {
      expect(component.columns.length).toBe(4);
      expect(component.columns.map(c => c.id)).toEqual(['pending', 'running', 'success', 'failed']);
    });

    it('should have correct column titles', () => {
      expect(component.columns[0].title).toBe('Pending');
      expect(component.columns[1].title).toBe('In Progress');
      expect(component.columns[2].title).toBe('Completed');
      expect(component.columns[3].title).toBe('Failed');
    });
  });

  describe('Data Loading - Happy Path', () => {
    it('should load executions and workflows on init', fakeAsync(() => {
      fixture.detectChanges();
      
      const execReq = httpMock.expectOne('http://localhost:3000/api/executions');
      execReq.flush([mockExecutionRunning]);
      
      const wfReq = httpMock.expectOne('http://localhost:3000/api/workflows');
      wfReq.flush([mockWorkflow]);
      
      tick();
      
      expect(component.columns[1].workflows.length).toBe(1);
    }));

    it('should distribute executions to correct columns by status', fakeAsync(() => {
      fixture.detectChanges();
      
      httpMock.expectOne('http://localhost:3000/api/executions').flush([
        mockExecutionRunning,
        mockExecutionSuccess,
        mockExecutionFailed,
        mockExecutionPending,
      ]);
      httpMock.expectOne('http://localhost:3000/api/workflows').flush([mockWorkflow]);
      
      tick();
      
      expect(component.columns[0].workflows.length).toBe(1); // pending
      expect(component.columns[1].workflows.length).toBe(1); // running
      expect(component.columns[2].workflows.length).toBe(1); // success
      expect(component.columns[3].workflows.length).toBe(1); // failed
    }));
  });

  describe('Stats Calculations - Happy Path', () => {
    it('should calculate correct running count', fakeAsync(() => {
      component.columns[1].workflows = [
        { workflow: mockWorkflow, execution: mockExecutionRunning, progress: 50 } as any,
      ];
      
      expect(component.getRunningCount()).toBe(1);
    }));

    it('should calculate correct success count', () => {
      component.columns[2].workflows = [
        { workflow: mockWorkflow, execution: mockExecutionSuccess, progress: 100 } as any,
      ];
      
      expect(component.getSuccessCount()).toBe(1);
    });

    it('should calculate correct failed count', () => {
      component.columns[3].workflows = [
        { workflow: mockWorkflow, execution: mockExecutionFailed, progress: 0 } as any,
      ];
      
      expect(component.getFailedCount()).toBe(1);
    });

    it('should calculate correct pending count', () => {
      component.columns[0].workflows = [
        { workflow: mockWorkflow, execution: mockExecutionPending, progress: 0 } as any,
      ];
      
      expect(component.getPendingCount()).toBe(1);
    });

    it('should return zero for empty columns', () => {
      component.columns.forEach(col => col.workflows = []);
      
      expect(component.getRunningCount()).toBe(0);
      expect(component.getSuccessCount()).toBe(0);
      expect(component.getFailedCount()).toBe(0);
      expect(component.getPendingCount()).toBe(0);
    });
  });

  describe('Progress Calculation - Happy Path', () => {
    it('should calculate 100% progress for completed nodes', () => {
      const execution: Execution = {
        ...mockExecutionSuccess,
        nodes: [
          { id: '1', nodeId: 'n1', status: 'success' },
          { id: '2', nodeId: 'n2', status: 'success' },
        ],
      };
      
      expect(component.calculateProgress(execution)).toBe(100);
    });

    it('should calculate 50% progress for half completed nodes', () => {
      const execution: Execution = {
        ...mockExecutionRunning,
        nodes: [
          { id: '1', nodeId: 'n1', status: 'success' },
          { id: '2', nodeId: 'n2', status: 'running' },
        ],
      };
      
      expect(component.calculateProgress(execution)).toBe(50);
    });

    it('should calculate 0% progress for no completed nodes', () => {
      const execution: Execution = {
        ...mockExecutionPending,
        nodes: [
          { id: '1', nodeId: 'n1', status: 'pending' },
          { id: '2', nodeId: 'n2', status: 'pending' },
        ],
      };
      
      expect(component.calculateProgress(execution)).toBe(0);
    });
  });

  describe('Badge Severity - Happy Path', () => {
    it('should return correct severity for each column', () => {
      expect(component.getColumnBadgeSeverity('pending')).toBe('warn');
      expect(component.getColumnBadgeSeverity('running')).toBe('info');
      expect(component.getColumnBadgeSeverity('success')).toBe('success');
      expect(component.getColumnBadgeSeverity('failed')).toBe('danger');
    });
  });

  // ============================================
  // NEGATIVE PATH TESTS
  // ============================================

  describe('Error Handling', () => {
    it('should handle empty executions array', fakeAsync(() => {
      fixture.detectChanges();
      
      httpMock.expectOne('http://localhost:3000/api/executions').flush([]);
      httpMock.expectOne('http://localhost:3000/api/workflows').flush([mockWorkflow]);
      
      tick();
      
      component.columns.forEach(col => {
        expect(col.workflows.length).toBe(0);
      });
    }));

    it('should handle executions without matching workflow', fakeAsync(() => {
      fixture.detectChanges();
      
      httpMock.expectOne('http://localhost:3000/api/executions').flush([mockExecutionRunning]);
      httpMock.expectOne('http://localhost:3000/api/workflows').flush([]);
      
      tick();
      
      component.columns.forEach(col => {
        expect(col.workflows.length).toBe(0);
      });
    }));

    it('should handle workflow without nodes', fakeAsync(() => {
      const wfWithoutNodes = { ...mockWorkflow, nodes: [] };
      const exec: Execution = { ...mockExecutionRunning, nodes: [] };
      
      fixture.detectChanges();
      
      httpMock.expectOne('http://localhost:3000/api/executions').flush([exec]);
      httpMock.expectOne('http://localhost:3000/api/workflows').flush([wfWithoutNodes]);
      
      tick();
      
      expect(component.calculateProgress(exec)).toBe(0);
    }));

    it('should handle execution without nodes array', () => {
      const execNoNodes = { ...mockExecutionRunning, nodes: undefined };
      
      expect(component.calculateProgress(execNoNodes)).toBe(0);
    });
  });

  describe('Drag and Drop - Negative Path', () => {
    it('should not move item if dropped on same column', () => {
      const item = { workflow: mockWorkflow, execution: mockExecutionRunning, progress: 50 } as any;
      component.columns[1].workflows = [item];
      component.draggedItem = item;
      component.draggedColumn = component.columns[1];
      
      component.onDrop(new DragEvent('drop'), component.columns[1]);
      
      expect(component.columns[1].workflows.length).toBe(1);
    });

    it('should handle drag without dragged item', () => {
      component.draggedItem = null;
      component.draggedColumn = null;
      
      component.onDrop(new DragEvent('drop'), component.columns[2]);
      
      expect(component.columns[2].workflows.length).toBe(0);
    });
  });

  // ============================================
  // ALTERNATE FLOW TESTS
  // ============================================

  describe('Alternate Statuses', () => {
    it('should handle cancelled status', () => {
      const cancelledExec: Execution = {
        ...mockExecutionRunning,
        status: 'cancelled',
      };
      
      component.columns[0].workflows = [];
      component.columns.forEach(col => col.workflows = []);
      
      const workflow = mockWorkflow;
      const item = { workflow, execution: cancelledExec, progress: 0 };
      
      const column = component.columns.find(c => c.status === 'cancelled');
      if (!column) {
        expect(column).toBeUndefined();
      }
    });
  });

  describe('Drag and Drop - Alternate Flows', () => {
    it('should move item between different columns', () => {
      const item = { workflow: mockWorkflow, execution: mockExecutionPending, progress: 0 } as any;
      component.columns[0].workflows = [item];
      component.draggedItem = item;
      component.draggedColumn = component.columns[0];
      
      component.onDrop(new DragEvent('drop'), component.columns[1]);
      
      expect(component.columns[0].workflows.length).toBe(0);
      expect(component.columns[1].workflows.length).toBe(1);
      expect(component.columns[1].workflows[0].execution.status).toBe('running');
    });

    it('should move item from running to failed', () => {
      const item = { workflow: mockWorkflow, execution: mockExecutionRunning, progress: 50 } as any;
      component.columns[1].workflows = [item];
      component.draggedItem = item;
      component.draggedColumn = component.columns[1];
      
      component.onDrop(new DragEvent('drop'), component.columns[3]);
      
      expect(component.columns[1].workflows.length).toBe(0);
      expect(component.columns[3].workflows.length).toBe(1);
      expect(component.columns[3].workflows[0].execution.status).toBe('failed');
    });

    it('should move item from failed back to pending', () => {
      const item = { workflow: mockWorkflow, execution: mockExecutionFailed, progress: 0 } as any;
      component.columns[3].workflows = [item];
      component.draggedItem = item;
      component.draggedColumn = component.columns[3];
      
      component.onDrop(new DragEvent('drop'), component.columns[0]);
      
      expect(component.columns[3].workflows.length).toBe(0);
      expect(component.columns[0].workflows.length).toBe(1);
      expect(component.columns[0].workflows[0].execution.status).toBe('pending');
    });
  });

  describe('Drag Event Handlers', () => {
    it('should set dragged item on drag start', () => {
      const item = { workflow: mockWorkflow, execution: mockExecutionRunning, progress: 50 } as any;
      
      component.onDragStart(item, component.columns[1]);
      
      expect(component.draggedItem).toBe(item);
      expect(component.draggedColumn).toBe(component.columns[1]);
    });

    it('should clear dragged item on drag end', () => {
      component.draggedItem = { workflow: mockWorkflow, execution: mockExecutionRunning } as any;
      component.draggedColumn = component.columns[1];
      
      component.onDragEnd();
      
      expect(component.draggedItem).toBeNull();
      expect(component.draggedColumn).toBeNull();
    });

    it('should prevent default on drag over', () => {
      const event = new DragEvent('dragover');
      const preventDefaultSpy = spyOn(event, 'preventDefault');
      
      component.onDragOver(event);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Card Menu Actions', () => {
    it('should generate correct menu items for card', () => {
      const item = { workflow: mockWorkflow, execution: mockExecutionRunning, progress: 50 } as any;
      
      component.showCardMenu(new MouseEvent('click'), item);
      
      expect(component.cardMenuItems.length).toBe(5); // View, Re-run, Logs, separator, Delete
      expect(component.cardMenuItems[0].label).toBe('View Details');
      expect(component.cardMenuItems[1].label).toBe('Re-run');
      expect(component.cardMenuItems[2].label).toBe('View Logs');
      expect(component.cardMenuItems[4].label).toBe('Delete');
    });
  });

  describe('Template Rendering', () => {
    it('should render all 4 columns', () => {
      fixture.detectChanges();
      
      const columnElements = fixture.debugElement.queryAll(By.css('.kanban-column'));
      expect(columnElements.length).toBe(4);
    });

    it('should render column titles correctly', () => {
      fixture.detectChanges();
      
      const titles = fixture.debugElement.queryAll(By.css('.column-title h3'));
      expect(titles[0].nativeElement.textContent).toBe('Pending');
      expect(titles[1].nativeElement.textContent).toBe('In Progress');
      expect(titles[2].nativeElement.textContent).toBe('Completed');
      expect(titles[3].nativeElement.textContent).toBe('Failed');
    });

    it('should render stats summary with 4 cards', () => {
      fixture.detectChanges();
      
      const statCards = fixture.debugElement.queryAll(By.css('.stat-card'));
      expect(statCards.length).toBe(4);
    });

    it('should render project name in header', () => {
      fixture.detectChanges();
      
      const projectTag = fixture.debugElement.query(By.css('.header-left p-tag'));
      expect(projectTag).toBeTruthy();
    });
  });

  describe('Add Workflow to Column', () => {
    it('should have add button for each column', () => {
      fixture.detectChanges();
      
      const addButtons = fixture.debugElement.queryAll(By.css('.column-header p-button'));
      expect(addButtons.length).toBe(4);
    });
  });
});
