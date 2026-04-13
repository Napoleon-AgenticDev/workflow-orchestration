import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Execution } from '../../models/workflow.model';

@Component({
  selector: 'app-executions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <header class="header">
        <h1>Execution History</h1>
      </header>

      <div class="executions-list">
        @for (exec of executions(); track exec.id) {
          <div class="execution-card" [class]="exec.status">
            <div class="exec-header">
              <span class="workflow-name">{{ exec.workflow?.name || exec.workflowId }}</span>
              <span class="status-badge">{{ exec.status }}</span>
            </div>
            <div class="exec-meta">
              <span>Started: {{ exec.startedAt | date:'short' }}</span>
              @if (exec.completedAt) {
                <span>Duration: {{ getDuration(exec) }}s</span>
              }
            </div>
            @if (exec.error) {
              <div class="error-msg">{{ exec.error }}</div>
            }
          </div>
        } @empty {
          <div class="empty-state">
            <p>No executions yet. Run a workflow to see results here.</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 2rem; max-width: 900px; margin: 0 auto; }
    .header { margin-bottom: 2rem; }
    h1 { margin: 0; color: #1a1a2e; }
    .executions-list { display: flex; flex-direction: column; gap: 1rem; }
    .execution-card { background: white; border-radius: 10px; padding: 1.25rem; border-left: 4px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .execution-card.running { border-left-color: #3b82f6; }
    .execution-card.success { border-left-color: #10b981; }
    .execution-card.failed { border-left-color: #dc2626; }
    .exec-header { display: flex; justify-content: space-between; align-items: center; }
    .workflow-name { font-weight: 600; color: #1a1a2e; }
    .status-badge { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
    .running .status-badge { background: #dbeafe; color: #2563eb; }
    .success .status-badge { background: #d1fae5; color: #059669; }
    .failed .status-badge { background: #fee2e2; color: #dc2626; }
    .pending .status-badge { background: #f1f5f9; color: #64748b; }
    .exec-meta { display: flex; gap: 1.5rem; margin-top: 0.75rem; color: #64748b; font-size: 0.85rem; }
    .error-msg { margin-top: 0.75rem; padding: 0.75rem; background: #fef2f2; border-radius: 6px; color: #dc2626; font-size: 0.85rem; }
    .empty-state { text-align: center; padding: 3rem; color: #64748b; }
  `]
})
export class ExecutionsComponent implements OnInit {
  executions = signal<Execution[]>([]);

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getExecutions().subscribe(data => this.executions.set(data));
  }

  getDuration(exec: Execution): string {
    if (!exec.startedAt || !exec.completedAt) return '-';
    const start = new Date(exec.startedAt).getTime();
    const end = new Date(exec.completedAt).getTime();
    return ((end - start) / 1000).toFixed(1);
  }
}