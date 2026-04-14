import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DragDropModule } from 'primeng/dragdrop';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { ApiService } from '../../services/api.service';
import { Workflow, Execution } from '@alchemy-flow/shared';

interface KanbanColumn {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  color: string;
  workflows: WorkflowExecution[];
}

interface WorkflowExecution {
  workflow: Workflow;
  execution: Execution;
  progress: number;
  assignee?: string;
  dueDate?: Date;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    DragDropModule,
    CardModule,
    ButtonModule,
    TagModule,
    ProgressBarModule,
    AvatarModule,
    AvatarGroupModule,
    TooltipModule,
    MenuModule,
  ],
  template: `
    <div class="dashboard">
      <header class="dashboard-header">
        <div class="header-left">
          <h1>Project Dashboard</h1>
          <p-tag [value]="selectedProject?.name || 'No Project Selected'" severity="info" />
        </div>
        <div class="header-right">
          <p-button 
            label="Run Workflow" 
            icon="pi pi-play" 
            styleClass="p-button-success"
            (onClick)="showRunDialog = true"
          />
        </div>
      </header>

      <div class="kanban-board">
        @for (column of columns; track column.id) {
          <div class="kanban-column" 
               (dragover)="onDragOver($event)" 
               (drop)="onDrop($event, column)">
            <div class="column-header">
              <div class="column-title">
                <span class="status-dot" [style.background-color]="column.color"></span>
                <h3>{{ column.title }}</h3>
                <p-badge [value]="column.workflows.length.toString()" [severity]="getColumnBadgeSeverity(column.id)" />
              </div>
              <p-button 
                icon="pi pi-plus" 
                styleClass="p-button-text p-button-sm"
                (onClick)="addWorkflowToColumn(column)"
              />
            </div>

            <div class="column-content">
              @for (item of column.workflows; track item.execution.id) {
                <div class="workflow-card" 
                     pDraggable 
                     (onDragStart)="onDragStart(item, column)"
                     (onDragEnd)="onDragEnd()">
                  <div class="card-header">
                    <h4>{{ item.workflow.name }}</h4>
                    <p-button 
                      icon="pi pi-ellipsis-v" 
                      styleClass="p-button-text p-button-sm p-button-rounded"
                      (onClick)="showCardMenu($event, item)"
                    />
                  </div>
                  
                  <p class="description">{{ item.workflow.description || 'No description' }}</p>
                  
                  <div class="progress-section" *ngIf="column.id === 'running'">
                    <div class="progress-label">
                      <span>Progress</span>
                      <span>{{ item.progress }}%</span>
                    </div>
                    <p-progressBar [value]="item.progress" [showValue]="false" styleClass="custom-progress" />
                  </div>

                  <div class="card-meta">
                    <div class="meta-item" *ngIf="item.execution.startedAt">
                      <i class="pi pi-clock"></i>
                      <span>{{ item.execution.startedAt | date:'short' }}</span>
                    </div>
                    <div class="meta-item" *ngIf="item.assignee">
                      <p-avatar [label]="item.assignee.charAt(0)" shape="circle" size="normal" styleClass="assignee-avatar" />
                      <span>{{ item.assignee }}</span>
                    </div>
                  </div>

                  <div class="card-footer">
                    <div class="workflow-nodes" *ngIf="item.workflow.nodes?.length">
                      <span class="node-count">{{ item.workflow.nodes.length }} nodes</span>
                    </div>
                    <p-button 
                      label="View" 
                      icon="pi pi-eye" 
                      styleClass="p-button-text p-button-sm"
                      [routerLink]="['/workflows', item.workflow.id]"
                    />
                  </div>
                </div>
              } @empty {
                <div class="empty-column">
                  <i class="pi pi-inbox"></i>
                  <p>No workflows</p>
                </div>
              }
            </div>
          </div>
        }
      </div>

      <div class="stats-summary">
        <div class="stat-card">
          <i class="pi pi-play-circle" style="color: #3b82f6;"></i>
          <div class="stat-info">
            <span class="stat-value">{{ getRunningCount() }}</span>
            <span class="stat-label">In Progress</span>
          </div>
        </div>
        <div class="stat-card">
          <i class="pi pi-check-circle" style="color: #10b981;"></i>
          <div class="stat-info">
            <span class="stat-value">{{ getSuccessCount() }}</span>
            <span class="stat-label">Completed</span>
          </div>
        </div>
        <div class="stat-card">
          <i class="pi pi-times-circle" style="color: #ef4444;"></i>
          <div class="stat-info">
            <span class="stat-value">{{ getFailedCount() }}</span>
            <span class="stat-label">Failed</span>
          </div>
        </div>
        <div class="stat-card">
          <i class="pi pi-clock" style="color: #f59e0b;"></i>
          <div class="stat-info">
            <span class="stat-value">{{ getPendingCount() }}</span>
            <span class="stat-label">Pending</span>
          </div>
        </div>
      </div>
    </div>

    <p-menu #cardMenu [model]="cardMenuItems" [popup]="true" />
  `,
  styles: [`
    .dashboard {
      padding: 1.5rem;
      height: calc(100vh - 60px);
      display: flex;
      flex-direction: column;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-left h1 {
      margin: 0;
      font-size: 1.5rem;
      color: #1e293b;
    }

    .kanban-board {
      display: flex;
      gap: 1rem;
      flex: 1;
      overflow-x: auto;
      padding-bottom: 1rem;
    }

    .kanban-column {
      flex: 0 0 300px;
      background: #f1f5f9;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      max-height: calc(100vh - 280px);
    }

    .column-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .column-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .column-title h3 {
      margin: 0;
      font-size: 0.9rem;
      font-weight: 600;
      color: #475569;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .column-content {
      flex: 1;
      overflow-y: auto;
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .workflow-card {
      background: white;
      border-radius: 8px;
      padding: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      cursor: grab;
      transition: all 0.2s;
    }

    .workflow-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .workflow-card:active {
      cursor: grabbing;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .card-header h4 {
      margin: 0;
      font-size: 0.95rem;
      color: #1e293b;
      font-weight: 600;
    }

    .description {
      margin: 0.5rem 0;
      font-size: 0.8rem;
      color: #64748b;
      line-height: 1.4;
    }

    .progress-section {
      margin: 0.75rem 0;
    }

    .progress-label {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: #64748b;
      margin-bottom: 0.25rem;
    }

    :host ::ng-deep .custom-progress .p-progressbar {
      height: 6px;
      background: #e2e8f0;
    }

    .card-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin: 0.75rem 0;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.75rem;
      color: #64748b;
    }

    .meta-item i {
      color: #94a3b8;
    }

    :host ::ng-deep .assignee-avatar {
      background: #6366f1;
      color: white;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.75rem;
      border-top: 1px solid #f1f5f9;
    }

    .node-count {
      font-size: 0.7rem;
      color: #94a3b8;
    }

    .empty-column {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      color: #94a3b8;
    }

    .empty-column i {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .stats-summary {
      display: flex;
      gap: 1rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e2e8f0;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .stat-card i {
      font-size: 1.5rem;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e293b;
    }

    .stat-label {
      font-size: 0.75rem;
      color: #64748b;
    }
  `]
})
export class DashboardComponent implements OnInit {
  showRunDialog = false;
  selectedProject: any = { id: 'proj-1', name: 'Marketing Automation' };
  draggedItem: WorkflowExecution | null = null;
  draggedColumn: KanbanColumn | null = null;

  cardMenuItems: MenuItem[] = [];

  columns: KanbanColumn[] = [
    { id: 'pending', title: 'Pending', status: 'pending', color: '#f59e0b', workflows: [] },
    { id: 'running', title: 'In Progress', status: 'running', color: '#3b82f6', workflows: [] },
    { id: 'success', title: 'Completed', status: 'success', color: '#10b981', workflows: [] },
    { id: 'failed', title: 'Failed', status: 'failed', color: '#ef4444', workflows: [] },
  ];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadExecutions();
  }

  loadExecutions() {
    this.api.getExecutions().subscribe(executions => {
      this.api.getWorkflows().subscribe(workflows => {
        this.distributeToColumns(executions, workflows);
      });
    });
  }

  distributeToColumns(executions: Execution[], workflows: Workflow[]) {
    this.columns.forEach(col => {
      col.workflows = [];
    });

    for (const exec of executions) {
      const workflow = workflows.find(w => w.id === exec.workflowId);
      if (!workflow) continue;

      const item: WorkflowExecution = {
        workflow,
        execution: exec,
        progress: this.calculateProgress(exec),
        assignee: 'User',
        dueDate: new Date(Date.now() + 86400000),
      };

      const column = this.columns.find(c => c.status === exec.status);
      if (column) {
        column.workflows.push(item);
      }
    }
  }

  calculateProgress(exec: Execution): number {
    if (!exec.nodes?.length) return 0;
    const completed = exec.nodes.filter(n => n.status === 'success' || n.status === 'failed').length;
    return Math.round((completed / exec.nodes.length) * 100);
  }

  getRunningCount(): number {
    return this.columns.find(c => c.id === 'running')?.workflows.length || 0;
  }

  getSuccessCount(): number {
    return this.columns.find(c => c.id === 'success')?.workflows.length || 0;
  }

  getFailedCount(): number {
    return this.columns.find(c => c.id === 'failed')?.workflows.length || 0;
  }

  getPendingCount(): number {
    return this.columns.find(c => c.id === 'pending')?.workflows.length || 0;
  }

  getColumnBadgeSeverity(columnId: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger'> = {
      pending: 'warn',
      running: 'info',
      success: 'success',
      failed: 'danger',
    };
    return map[columnId];
  }

  onDragStart(item: WorkflowExecution, column: KanbanColumn) {
    this.draggedItem = item;
    this.draggedColumn = column;
  }

  onDragEnd() {
    this.draggedItem = null;
    this.draggedColumn = null;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent, targetColumn: KanbanColumn) {
    event.preventDefault();
    if (!this.draggedItem || !this.draggedColumn) return;
    if (this.draggedColumn.id === targetColumn.id) return;

    const oldColumn = this.columns.find(c => c.id === this.draggedColumn!.id);
    if (oldColumn) {
      const index = oldColumn.workflows.findIndex(w => w.execution.id === this.draggedItem!.execution.id);
      if (index > -1) {
        oldColumn.workflows.splice(index, 1);
      }
    }

    this.draggedItem.execution.status = targetColumn.status as any;
    targetColumn.workflows.push(this.draggedItem);

    this.draggedItem = null;
    this.draggedColumn = null;
  }

  showCardMenu(event: Event, item: WorkflowExecution) {
    this.cardMenuItems = [
      { label: 'View Details', icon: 'pi pi-eye', command: () => console.log('View', item) },
      { label: 'Re-run', icon: 'pi pi-refresh', command: () => this.rerunWorkflow(item) },
      { label: 'View Logs', icon: 'pi pi-file', command: () => console.log('Logs', item) },
      { separator: true },
      { label: 'Delete', icon: 'pi pi-trash', styleClass: 'p-menuitem-danger', command: () => this.deleteExecution(item) },
    ];
  }

  rerunWorkflow(item: WorkflowExecution) {
    this.api.executeWorkflow(item.workflow.id).subscribe(() => {
      this.loadExecutions();
    });
  }

  deleteExecution(item: WorkflowExecution) {
    console.log('Delete execution', item);
  }

  addWorkflowToColumn(column: KanbanColumn) {
    console.log('Add workflow to', column.id);
  }
}
