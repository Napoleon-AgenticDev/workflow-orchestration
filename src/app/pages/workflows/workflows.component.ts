import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Workflow } from '../../models/workflow.model';

@Component({
  selector: 'app-workflows',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <header class="header">
        <h1>Workflows</h1>
        <button class="btn-primary" (click)="createWorkflow()">+ New Workflow</button>
      </header>

      <div class="workflow-grid">
        @for (wf of workflows(); track wf.id) {
          <div class="workflow-card" [class.active]="wf.metadata?.status === 'active'">
            <div class="card-header">
              <h3>{{ wf.name }}</h3>
              <span class="badge" [class]="wf.metadata?.status || 'draft'">{{ wf.metadata?.status || 'draft' }}</span>
            </div>
            <p class="description">{{ wf.description || 'No description' }}</p>
            <div class="card-meta">
              <span>{{ wf.nodes?.length || 0 }} nodes</span>
              <span>{{ wf.trigger?.type }}</span>
            </div>
            <div class="card-actions">
              <button class="btn-secondary" [routerLink]="['/workflows', wf.id]">Edit</button>
              <button class="btn-danger" (click)="deleteWorkflow(wf.id)">Delete</button>
            </div>
          </div>
        } @empty {
          <div class="empty-state">
            <p>No workflows yet. Create your first workflow!</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 2rem; max-width: 1200px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    h1 { margin: 0; color: #1a1a2e; }
    .btn-primary { background: #667eea; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-secondary { background: #e2e8f0; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
    .btn-danger { background: #fee2e2; color: #dc2626; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
    .workflow-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
    .workflow-card { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 2px solid transparent; transition: all 0.2s; }
    .workflow-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
    .workflow-card.active { border-color: #10b981; }
    .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; }
    .card-header h3 { margin: 0; color: #1a1a2e; font-size: 1.1rem; }
    .badge { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
    .badge.draft { background: #f1f5f9; color: #64748b; }
    .badge.active { background: #d1fae5; color: #059669; }
    .badge.paused { background: #fef3c7; color: #d97706; }
    .description { color: #64748b; font-size: 0.9rem; margin: 0.5rem 0; }
    .card-meta { display: flex; gap: 1rem; color: #94a3b8; font-size: 0.8rem; margin: 1rem 0; }
    .card-actions { display: flex; gap: 0.5rem; }
    .empty-state { grid-column: 1 / -1; text-align: center; padding: 3rem; color: #64748b; }
  `]
})
export class WorkflowsComponent implements OnInit {
  workflows = signal<Workflow[]>([]);

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadWorkflows();
  }

  loadWorkflows() {
    this.api.getWorkflows().subscribe(data => this.workflows.set(data));
  }

  createWorkflow() {
    const newWf = {
      name: 'New Workflow',
      description: 'A new workflow',
      trigger: { type: 'manual' as const, config: {} },
      metadata: { status: 'draft' as const }
    };
    this.api.createWorkflow(newWf).subscribe(wf => {
      this.loadWorkflows();
    });
  }

  deleteWorkflow(id: string) {
    if (confirm('Delete this workflow?')) {
      this.api.deleteWorkflow(id).subscribe(() => this.loadWorkflows());
    }
  }
}