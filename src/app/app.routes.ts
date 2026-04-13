import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  { path: '', redirectTo: 'workflows', pathMatch: 'full' },
  { 
    path: 'workflows', 
    loadComponent: () => import('./pages/workflows/workflows.component').then(m => m.WorkflowsComponent)
  },
  { 
    path: 'workflows/:id', 
    loadComponent: () => import('./pages/workflow-editor/workflow-editor.component').then(m => m.WorkflowEditorComponent)
  },
  { 
    path: 'executions', 
    loadComponent: () => import('./pages/executions/executions.component').then(m => m.ExecutionsComponent)
  },
  { 
    path: 'schedules', 
    loadComponent: () => import('./pages/schedules/schedules.component').then(m => m.SchedulesComponent)
  },
];