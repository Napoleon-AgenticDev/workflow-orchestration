import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  { path: '', redirectTo: 'products', pathMatch: 'full' },
  { 
    path: 'products', 
    loadComponent: () => import('./pages/products/products.component').then(m => m.ProductsComponent)
  },
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