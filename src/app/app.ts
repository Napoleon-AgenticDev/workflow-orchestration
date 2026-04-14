import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SplitButtonModule } from 'primeng/splitbutton';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MenubarModule,
    ButtonModule,
    SplitButtonModule,
    AvatarModule,
    BadgeModule,
  ],
  template: `
    <div class="app-container">
      <nav class="topnav">
        <div class="nav-left">
          <span class="logo">⚗️ Alchemy Flow</span>
        </div>
        
        <div class="nav-center">
          <div class="view-toggle">
            <button 
              class="toggle-btn" 
              [class.active]="currentView === 'dashboard'"
              (click)="navigateTo('dashboard')"
            >
              <i class="pi pi-th-large"></i>
              Dashboard
            </button>
            <button 
              class="toggle-btn" 
              [class.active]="currentView === 'templates'"
              (click)="navigateTo('templates')"
            >
              <i class="pi pi-book"></i>
              Templates
            </button>
          </div>
        </div>

        <div class="nav-right">
          <div class="project-selector" *ngIf="projects.length > 0">
            <p-splitButton 
              label="{{ selectedProject?.name || 'Select Project' }}" 
              (onClick)="selectProject(selectedProject)"
              [model]="projectMenuItems"
              styleClass="p-button-outlined p-button-sm"
            >
            </p-splitButton>
          </div>
          <p-button 
            icon="pi pi-plus" 
            label="New Project"
            (onClick)="createProject()"
            styleClass="p-button-sm p-button-success"
            *ngIf="projects.length === 0"
          />
          <p-avatar 
            icon="pi pi-user" 
            shape="circle" 
            styleClass="user-avatar"
          />
        </div>
      </nav>

      <main class="content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .topnav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1.5rem;
      background: #1e293b;
      border-bottom: 1px solid #334155;
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .nav-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .logo {
      font-size: 1.25rem;
      font-weight: 700;
      color: #f8fafc;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .nav-center {
      display: flex;
      justify-content: center;
    }

    .view-toggle {
      display: flex;
      background: #0f172a;
      border-radius: 8px;
      padding: 4px;
      gap: 4px;
    }

    .toggle-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: transparent;
      border: none;
      color: #94a3b8;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s;
    }

    .toggle-btn:hover {
      color: #e2e8f0;
      background: #1e293b;
    }

    .toggle-btn.active {
      background: #6366f1;
      color: white;
    }

    .nav-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .project-selector {
      display: flex;
      align-items: center;
    }

    :host ::ng-deep .user-avatar {
      background: #475569;
      color: #f8fafc;
    }

    .content {
      flex: 1;
      background: #f8fafc;
      overflow-y: auto;
    }
  `]
})
export class App {
  currentView: 'dashboard' | 'templates' = 'dashboard';
  
  projects = [
    { id: 'proj-1', name: 'Marketing Automation' },
    { id: 'proj-2', name: 'CI/CD Pipeline' },
    { id: 'proj-3', name: 'Lead Management' },
  ];

  selectedProject = this.projects[0];

  projectMenuItems: MenuItem[] = [
    { label: 'Marketing Automation', command: () => this.selectProject(this.projects[0]) },
    { label: 'CI/CD Pipeline', command: () => this.selectProject(this.projects[1]) },
    { label: 'Lead Management', command: () => this.selectProject(this.projects[2]) },
    { separator: true },
    { label: 'Create New Project', icon: 'pi pi-plus', command: () => this.createProject() },
  ];

  constructor(private router: Router) {}

  navigateTo(view: 'dashboard' | 'templates') {
    this.currentView = view;
    if (view === 'templates') {
      this.router.navigate(['/templates']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  selectProject(project: any) {
    this.selectedProject = project;
  }

  createProject() {
    console.log('Create new project');
  }
}
