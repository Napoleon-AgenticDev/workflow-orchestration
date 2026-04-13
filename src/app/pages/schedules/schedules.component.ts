import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Workflow, Schedule } from '@alchemy-flow/shared';

@Component({
  selector: 'app-schedules',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <header class="header">
        <h1>Schedules</h1>
        <button class="btn-primary" (click)="showCreate = true">+ New Schedule</button>
      </header>

      @if (showCreate) {
        <div class="create-form">
          <h3>Create Schedule</h3>
          <div class="form-row">
            <input [(ngModel)]="newSchedule.name" placeholder="Schedule name">
            <select [(ngModel)]="newSchedule.workflowId">
              <option value="">Select workflow</option>
              @for (wf of workflows(); track wf.id) {
                <option [value]="wf.id">{{ wf.name }}</option>
              }
            </select>
          </div>
          <div class="form-row">
            <input [(ngModel)]="newSchedule.cronExpression" placeholder="Cron (e.g., 0 8 * * *)">
            <input [(ngModel)]="newSchedule.timezone" placeholder="Timezone (e.g., America/Denver)">
          </div>
          <div class="form-actions">
            <button class="btn-secondary" (click)="showCreate = false">Cancel</button>
            <button class="btn-primary" (click)="createSchedule()">Create</button>
          </div>
        </div>
      }

      <div class="schedules-list">
        @for (sch of schedules(); track sch.id) {
          <div class="schedule-card" [class.disabled]="!sch.enabled">
            <div class="sch-header">
              <span class="sch-name">{{ sch.name }}</span>
              <label class="toggle">
                <input type="checkbox" [checked]="sch.enabled" (change)="toggleSchedule(sch)">
                <span class="slider"></span>
              </label>
            </div>
            <div class="sch-details">
              <span>Workflow: {{ sch.workflow?.name || sch.workflowId }}</span>
              <span>Cron: {{ sch.cronExpression }}</span>
              <span>Timezone: {{ sch.timezone }}</span>
            </div>
            <div class="sch-actions">
              <button class="btn-small" (click)="triggerSchedule(sch.id)">Run Now</button>
              <button class="btn-danger" (click)="deleteSchedule(sch.id)">Delete</button>
            </div>
          </div>
        } @empty {
          <div class="empty-state">
            <p>No schedules yet.</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 2rem; max-width: 900px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    h1 { margin: 0; color: #1a1a2e; }
    .btn-primary { background: #667eea; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-secondary { background: #e2e8f0; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
    .btn-small { background: #e2e8f0; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; font-size: 0.85rem; }
    .btn-danger { background: #fee2e2; color: #dc2626; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; font-size: 0.85rem; }
    .create-form { background: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .create-form h3 { margin: 0 0 1rem; }
    .form-row { display: flex; gap: 1rem; margin-bottom: 1rem; }
    .form-row input, .form-row select { flex: 1; padding: 0.6rem; border: 1px solid #e2e8f0; border-radius: 6px; }
    .form-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
    .schedules-list { display: flex; flex-direction: column; gap: 1rem; }
    .schedule-card { background: white; border-radius: 10px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .schedule-card.disabled { opacity: 0.6; }
    .sch-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .sch-name { font-weight: 600; color: #1a1a2e; }
    .sch-details { display: flex; gap: 1.5rem; color: #64748b; font-size: 0.85rem; margin-bottom: 1rem; }
    .sch-actions { display: flex; gap: 0.5rem; }
    .toggle { position: relative; width: 44px; height: 24px; }
    .toggle input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: #cbd5e1; transition: 0.3s; border-radius: 24px; }
    .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background: white; transition: 0.3s; border-radius: 50%; }
    .toggle input:checked + .slider { background: #10b981; }
    .toggle input:checked + .slider:before { transform: translateX(20px); }
    .empty-state { text-align: center; padding: 3rem; color: #64748b; }
  `]
})
export class SchedulesComponent implements OnInit {
  schedules = signal<Schedule[]>([]);
  workflows = signal<Workflow[]>([]);
  showCreate = false;
  newSchedule = { name: '', workflowId: '', cronExpression: '0 8 * * *', timezone: 'America/Denver' };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.api.getSchedules().subscribe(data => this.schedules.set(data));
    this.api.getWorkflows().subscribe(data => this.workflows.set(data));
  }

  createSchedule() {
    this.api.createSchedule(this.newSchedule).subscribe(() => {
      this.showCreate = false;
      this.newSchedule = { name: '', workflowId: '', cronExpression: '0 8 * * *', timezone: 'America/Denver' };
      this.loadData();
    });
  }

  toggleSchedule(sch: Schedule) {
    this.api.updateSchedule(sch.id, { enabled: !sch.enabled }).subscribe(() => this.loadData());
  }

  triggerSchedule(id: string) {
    this.api.triggerSchedule(id).subscribe();
  }

  deleteSchedule(id: string) {
    if (confirm('Delete this schedule?')) {
      this.api.deleteSchedule(id).subscribe(() => this.loadData());
    }
  }
}