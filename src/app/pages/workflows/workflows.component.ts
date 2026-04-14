import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ChipModule } from 'primeng/chip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { ApiService } from '../../services/api.service';
import { Workflow } from '@alchemy-flow/shared';

interface SortOption {
  label: string;
  value: 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'status';
}

interface FilterOption {
  label: string;
  value: 'all' | 'active' | 'draft' | 'paused';
}

@Component({
  selector: 'app-workflows',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    InputTextModule,
    DropdownModule,
    ButtonModule,
    TagModule,
    CardModule,
    IconFieldModule,
    InputIconModule,
    ChipModule,
    ConfirmDialogModule,
  ],
  providers: [ConfirmationService],
  template: `
    <div class="page">
      <header class="header">
        <div class="title-section">
          <h1>Workflow Templates</h1>
          <p-tag [value]="filteredWorkflows().length + ' templates'" severity="secondary" />
        </div>
        <p-button label="New Template" icon="pi pi-plus" (onClick)="createWorkflow()" />
      </header>

      <div class="toolbar">
        <p-iconfield iconPosition="left" class="search-field">
          <p-inputicon styleClass="pi pi-search" />
          <input 
            type="text" 
            pInputText 
            [(ngModel)]="searchQuery" 
            (ngModelChange)="applyFilters()"
            placeholder="Search workflows by name, description, or tags..." 
            class="w-full"
          />
        </p-iconfield>

        <div class="filters">
          <p-dropdown
            [options]="statusOptions"
            [(ngModel)]="statusFilter"
            (onChange)="applyFilters()"
            placeholder="Filter by status"
            [showClear]="true"
            styleClass="filter-dropdown"
          />

          <p-dropdown
            [options]="sortOptions"
            [(ngModel)]="sortBy"
            (onChange)="applyFilters()"
            placeholder="Sort by"
            styleClass="sort-dropdown"
          />
        </div>
      </div>

      <div class="active-filters" *ngIf="hasActiveFilters()">
        <span class="label">Active filters:</span>
        <p-chip *ngIf="searchQuery" [label]="'Search: ' + searchQuery" [removable]="true" (onRemove)="clearSearch()" />
        <p-chip *ngIf="statusFilter && statusFilter !== 'all'" [label]="'Status: ' + statusFilter" [removable]="true" (onRemove)="clearStatusFilter()" />
        <p-button label="Clear all" (onClick)="clearAllFilters()" styleClass="p-button-text p-button-sm" />
      </div>

      <div class="workflow-grid">
        @for (wf of filteredWorkflows(); track wf.id) {
          <p-card styleClass="workflow-card" [class.active]="wf.metadata?.status === 'active'">
            <ng-template pTemplate="header">
              <div class="card-header">
                <h3>{{ wf.name }}</h3>
                <p-tag [value]="wf.metadata?.status || 'draft'" [severity]="getStatusSeverity(wf.metadata?.status || 'draft')" />
              </div>
            </ng-template>
            
            <p class="description">{{ wf.description || 'No description' }}</p>
            
            <div class="card-meta">
              <div class="meta-item">
                <i class="pi pi-calendar"></i>
                <span>{{ wf.updatedAt | date:'MMM d, y, h:mm a' }}</span>
              </div>
              <div class="meta-item">
                <i class="pi pi-sitemap"></i>
                <span>{{ wf.nodes?.length || 0 }} nodes</span>
              </div>
              <div class="meta-item">
                <p-tag [value]="wf.trigger?.type || 'manual'" [severity]="getTriggerSeverity(wf.trigger?.type)" />
              </div>
            </div>

            <div class="card-tags" *ngIf="wf.metadata?.tags?.length">
              <p-chip *ngFor="let tag of wf.metadata?.tags" [label]="tag" styleClass="tag-chip" />
            </div>

            <ng-template pTemplate="footer">
              <div class="card-actions">
                <p-button 
                  label="Edit" 
                  icon="pi pi-pencil" 
                  [routerLink]="['/workflows', wf.id]"
                  styleClass="p-button-outlined p-button-sm"
                />
                <p-button 
                  label="Delete" 
                  icon="pi pi-trash" 
                  (onClick)="confirmDelete(wf.id)"
                  styleClass="p-button-outlined p-button-danger p-button-sm"
                />
              </div>
            </ng-template>
          </p-card>
        } @empty {
          <div class="empty-state">
            <i class="pi pi-inbox" style="font-size: 3rem; color: #94a3b8;"></i>
            <h3>No workflows found</h3>
            <p *ngIf="hasActiveFilters()">Try adjusting your search or filters</p>
            <p *ngIf="!hasActiveFilters()">Create your first workflow to get started</p>
            <p-button *ngIf="!hasActiveFilters()" label="New Workflow" (onClick)="createWorkflow()" icon="pi pi-plus" />
            <p-button *ngIf="hasActiveFilters()" label="Clear filters" (onClick)="clearAllFilters()" styleClass="p-button-outlined" />
          </div>
        }
      </div>
    </div>

    <p-confirmdialog />
  `,
  styles: [`
    .page { padding: 2rem; max-width: 1400px; margin: 0 auto; }
    
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    .title-section { display: flex; align-items: center; gap: 1rem; }
    .title-section h1 { margin: 0; color: #1a1a2e; font-size: 1.75rem; }
    
    .toolbar { display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; align-items: center; }
    .search-field { flex: 1; min-width: 280px; }
    .filters { display: flex; gap: 0.75rem; }
    
    :host ::ng-deep .filter-dropdown, :host ::ng-deep .sort-dropdown { min-width: 160px; }
    
    .active-filters { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .active-filters .label { font-size: 0.85rem; color: #64748b; }
    
    .workflow-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.5rem; }
    
    :host ::ng-deep .workflow-card { transition: all 0.2s; }
    :host ::ng-deep .workflow-card:hover { transform: translateY(-2px); }
    :host ::ng-deep .workflow-card.active { border-left: 4px solid #10b981; }
    
    :host ::ng-deep .workflow-card .p-card-header { padding-bottom: 0; }
    :host ::ng-deep .workflow-card .p-card-body { padding: 1rem; }
    :host ::ng-deep .workflow-card .p-card-footer { padding-top: 0; }
    
    .card-header { display: flex; justify-content: space-between; align-items: center; }
    .card-header h3 { margin: 0; color: #1a1a2e; font-size: 1.1rem; font-weight: 600; }
    
    .description { color: #64748b; font-size: 0.9rem; margin: 0.5rem 0; line-height: 1.5; }
    
    .card-meta { display: flex; flex-wrap: wrap; gap: 1rem; margin: 1rem 0; }
    .meta-item { display: flex; align-items: center; gap: 0.35rem; color: #64748b; font-size: 0.8rem; }
    .meta-item i { color: #94a3b8; }
    
    .card-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem; }
    :host ::ng-deep .tag-chip { font-size: 0.7rem; }
    
    .card-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
    
    .empty-state { grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; color: #64748b; background: #f8fafc; border-radius: 12px; }
    .empty-state h3 { margin: 1rem 0 0.5rem; color: #475569; }
    .empty-state p { margin: 0.5rem 0; }
  `]
})
export class WorkflowsComponent implements OnInit {
  workflows = signal<Workflow[]>([]);
  searchQuery = '';
  statusFilter: FilterOption['value'] = 'all';
  sortBy: SortOption['value'] = 'newest';

  sortOptions: SortOption[] = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Oldest First', value: 'oldest' },
    { label: 'Name A-Z', value: 'name-asc' },
    { label: 'Name Z-A', value: 'name-desc' },
    { label: 'By Status', value: 'status' },
  ];

  statusOptions: FilterOption[] = [
    { label: 'Active', value: 'active' },
    { label: 'Draft', value: 'draft' },
    { label: 'Paused', value: 'paused' },
  ];

  filteredWorkflows = computed(() => {
    let result = [...this.workflows()];
    
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(wf => 
        wf.name.toLowerCase().includes(query) ||
        wf.description?.toLowerCase().includes(query) ||
        wf.metadata?.tags?.some(t => t.toLowerCase().includes(query))
      );
    }
    
    if (this.statusFilter && this.statusFilter !== 'all') {
      result = result.filter(wf => wf.metadata?.status === this.statusFilter);
    }
    
    switch (this.sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
        break;
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'status':
        const statusOrder: Record<string, number> = { active: 0, paused: 1, draft: 2 };
        result.sort((a, b) => (statusOrder[a.metadata?.status || 'draft'] ?? 3) - (statusOrder[b.metadata?.status || 'draft'] ?? 3));
        break;
    }
    
    return result;
  });

  constructor(
    private api: ApiService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loadWorkflows();
  }

  loadWorkflows() {
    this.api.getWorkflows().subscribe(data => this.workflows.set(data));
  }

  applyFilters() {
    this.filteredWorkflows();
  }

  hasActiveFilters(): boolean {
    return !!this.searchQuery || (!!this.statusFilter && this.statusFilter !== 'all');
  }

  clearSearch() {
    this.searchQuery = '';
    this.applyFilters();
  }

  clearStatusFilter() {
    this.statusFilter = 'all';
    this.applyFilters();
  }

  clearAllFilters() {
    this.searchQuery = '';
    this.statusFilter = 'all';
    this.applyFilters();
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'secondary' | 'contrast' | undefined {
    const map: Record<string, 'success' | 'info' | 'warn' | 'secondary'> = {
      active: 'success',
      draft: 'secondary',
      paused: 'warn',
    };
    return map[status];
  }

  getTriggerSeverity(trigger: string | undefined): 'success' | 'info' | 'warn' | 'secondary' | undefined {
    const map: Record<string, 'success' | 'info' | 'warn' | 'secondary'> = {
      cron: 'info',
      webhook: 'warn',
      manual: 'secondary',
      event: 'info',
    };
    return map[trigger || 'manual'];
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

  confirmDelete(id: string) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this workflow?',
      header: 'Delete Workflow',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.deleteWorkflow(id).subscribe(() => this.loadWorkflows());
      }
    });
  }
}
