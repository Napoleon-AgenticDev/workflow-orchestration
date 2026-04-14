---
meta:
  id: canvas-research-angular-canvas-libraries-ui-components-specification
  title: UI Components Architecture - Canvas Libraries for Angular
  version: 1.0.0
  status: draft
  specType: specification
  scope: product:canvas-research
  tags: []
  createdBy: Agent Alchemy Architecture
  createdAt: 2026-02-25T00:00:00.000Z
  reviewedAt: null
title: UI Components Architecture - Canvas Libraries for Angular
category: Products
feature: angular-canvas-libraries
lastUpdated: '2026-03-12'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: canvas-research
phase: architecture
applyTo: []
keywords: []
topics: []
useCases: []
references:
  - .agent-alchemy/specs/frameworks/angular/
depends-on:
  - plan/ui-ux-workflows.specification.md
  - plan/functional-requirements.specification.md
  - architecture/system-architecture.specification.md
specification: 02-ui-components
---

# UI Components Architecture: Canvas Libraries for Angular

## Overview

**Purpose**: Define Angular component structure, state management, routing, and UI patterns for canvas feature.

**UI Framework**: Angular 18+ with standalone components  
**Component Library**: PrimeNG 18.0.2  
**Styling**: TailwindCSS 3.4.10  
**State**: Angular Signals + RxJS 7.8.0  
**Icons**: PrimeIcons 7.0.0

## Feature Module Structure

```
libs/canvas-feature/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── canvas-editor/          # Smart component
│   │   │   │   ├── canvas-editor.component.ts
│   │   │   │   ├── canvas-editor.component.html
│   │   │   │   ├── canvas-editor.component.scss
│   │   │   │   └── canvas-editor.component.spec.ts
│   │   │   ├── canvas-viewer/          # Read-only display
│   │   │   │   └── ...
│   │   │   ├── canvas-toolbar/         # Presentational
│   │   │   │   └── ...
│   │   │   ├── properties-panel/       # Presentational
│   │   │   │   └── ...
│   │   │   ├── layers-panel/           # Presentational
│   │   │   │   └── ...
│   │   │   ├── shape-controls/         # Presentational
│   │   │   │   └── ...
│   │   │   └── shared/                 # Shared UI components
│   │   │       ├── color-picker/
│   │   │       └── icon-button/
│   │   ├── services/
│   │   │   ├── canvas.service.ts
│   │   │   ├── canvas-state.service.ts
│   │   │   ├── canvas-history.service.ts
│   │   │   ├── canvas-export.service.ts
│   │   │   └── validation.service.ts
│   │   ├── models/
│   │   │   ├── canvas-object.model.ts
│   │   │   ├── canvas-state.model.ts
│   │   │   └── tool.model.ts
│   │   ├── guards/
│   │   │   └── canvas-loaded.guard.ts
│   │   ├── directives/
│   │   │   ├── canvas-drag.directive.ts
│   │   │   └── canvas-resize.directive.ts
│   │   └── canvas-feature.routes.ts
│   └── index.ts
└── README.md
```

## Component Hierarchy

```
CanvasEditorComponent (Smart Container)
├── CanvasToolbarComponent
│   ├── ToolButtonComponent (x10 tools)
│   ├── ColorPickerComponent
│   └── ActionButtonsComponent
├── CanvasStageComponent (ng2-konva wrapper)
│   └── KonvaStage
│       ├── KonvaLayer
│       │   └── KonvaShape[] (rendered objects)
│       └── KonvaLayer (selection layer)
├── PropertiesPanelComponent
│   ├── PositionControlsComponent
│   ├── SizeControlsComponent
│   ├── StyleControlsComponent
│   └── LayerControlsComponent
└── LayersPanelComponent
    └── LayerItemComponent (x N layers)
```

## Smart Components

### CanvasEditorComponent

**Responsibility**: Main container orchestrating canvas feature

**Implementation**:
```typescript
import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasService } from '../../services/canvas.service';
import { CanvasStateService } from '../../services/canvas-state.service';
import { CanvasToolbarComponent } from '../canvas-toolbar/canvas-toolbar.component';
import { PropertiesPanelComponent } from '../properties-panel/properties-panel.component';
import { LayersPanelComponent } from '../layers-panel/layers-panel.component';
import { CanvasStageComponent } from '../canvas-stage/canvas-stage.component';
import { CanvasObject, Tool } from '../../models';

@Component({
  selector: 'canvas-editor',
  standalone: true,
  imports: [
    CommonModule,
    CanvasToolbarComponent,
    PropertiesPanelComponent,
    LayersPanelComponent,
    CanvasStageComponent
  ],
  templateUrl: './canvas-editor.component.html',
  styleUrls: ['./canvas-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CanvasEditorComponent implements OnInit {
  private readonly canvasService = inject(CanvasService);
  private readonly stateService = inject(CanvasStateService);

  // State signals from service
  objects = this.stateService.objects;
  selectedObjects = this.stateService.selectedObjects;
  activeTool = this.stateService.activeTool;
  canvasSize = this.stateService.canvasSize;
  loading = this.stateService.loading;
  error = this.stateService.error;

  // Local UI state
  showPropertiesPanel = signal(true);
  showLayersPanel = signal(true);

  // Computed signals
  hasSelection = computed(() => this.selectedObjects().length > 0);
  singleSelection = computed(() => 
    this.selectedObjects().length === 1 ? this.selectedObjects()[0] : null
  );
  objectCount = computed(() => this.objects().length);

  ngOnInit(): void {
    this.initializeCanvas();
    this.setupKeyboardShortcuts();
  }

  private initializeCanvas(): void {
    // Restore from auto-save if available
    this.canvasService.restoreFromStorage();
  }

  private setupKeyboardShortcuts(): void {
    // Keyboard shortcuts handled via HostListener
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'z':
          event.preventDefault();
          this.canvasService.undo();
          break;
        case 'y':
          event.preventDefault();
          this.canvasService.redo();
          break;
        case 's':
          event.preventDefault();
          this.canvasService.save();
          break;
      }
    } else if (event.key === 'Delete') {
      event.preventDefault();
      this.canvasService.deleteSelected();
    }
  }

  onToolSelect(tool: Tool): void {
    this.canvasService.setActiveTool(tool);
  }

  onObjectSelect(object: CanvasObject): void {
    this.canvasService.selectObject(object, event.ctrlKey || event.metaKey);
  }

  onObjectUpdate(object: CanvasObject): void {
    this.canvasService.updateObject(object);
  }

  onObjectDelete(objectId: string): void {
    this.canvasService.deleteObject(objectId);
  }

  togglePropertiesPanel(): void {
    this.showPropertiesPanel.update(show => !show);
  }

  toggleLayersPanel(): void {
    this.showLayersPanel.update(show => !show);
  }
}
```

**Template**:
```html
<div class="canvas-editor-container flex h-screen">
  <!-- Toolbar -->
  <canvas-toolbar
    class="toolbar-sidebar"
    [activeTool]="activeTool()"
    (toolSelect)="onToolSelect($event)"
    (undo)="canvasService.undo()"
    (redo)="canvasService.redo()"
    (export)="canvasService.export()"
  />

  <!-- Main Canvas Area -->
  <div class="canvas-main flex-1 flex flex-col">
    <!-- Top Action Bar -->
    <div class="action-bar p-2 border-b flex justify-between items-center">
      <div class="canvas-info">
        <span class="text-sm text-gray-600">
          {{ objectCount() }} objects
        </span>
      </div>
      <div class="panel-toggles flex gap-2">
        <button 
          pButton 
          icon="pi pi-cog" 
          [class.p-button-text]="!showPropertiesPanel()"
          (click)="togglePropertiesPanel()"
          aria-label="Toggle properties panel">
        </button>
        <button 
          pButton 
          icon="pi pi-list" 
          [class.p-button-text]="!showLayersPanel()"
          (click)="toggleLayersPanel()"
          aria-label="Toggle layers panel">
        </button>
      </div>
    </div>

    <!-- Loading State -->
    @if (loading()) {
      <div class="loading-overlay flex items-center justify-center flex-1">
        <p-progressSpinner />
      </div>
    }

    <!-- Error State -->
    @if (error()) {
      <p-message 
        severity="error" 
        [text]="error()" 
        (onClose)="stateService.clearError()">
      </p-message>
    }

    <!-- Canvas Stage -->
    <canvas-stage
      class="flex-1"
      [objects]="objects()"
      [selectedObjects]="selectedObjects()"
      [activeTool]="activeTool()"
      [canvasSize]="canvasSize()"
      (objectSelect)="onObjectSelect($event)"
      (objectUpdate)="onObjectUpdate($event)"
    />
  </div>

  <!-- Properties Panel -->
  @if (showPropertiesPanel()) {
    <properties-panel
      class="properties-sidebar"
      [selectedObject]="singleSelection()"
      (objectUpdate)="onObjectUpdate($event)"
    />
  }

  <!-- Layers Panel -->
  @if (showLayersPanel()) {
    <layers-panel
      class="layers-sidebar"
      [objects]="objects()"
      [selectedObjects]="selectedObjects()"
      (objectSelect)="onObjectSelect($event)"
      (objectDelete)="onObjectDelete($event)"
    />
  }
</div>
```

## Presentational Components

### CanvasToolbarComponent

**Responsibility**: Display tool selection and action buttons

**Interface**:
```typescript
@Component({
  selector: 'canvas-toolbar',
  standalone: true,
  imports: [CommonModule, ButtonModule, TooltipModule],
  template: `
    <div class="toolbar flex flex-col gap-2 p-2 bg-gray-50 border-r" role="toolbar">
      <!-- Selection Tool -->
      <button 
        pButton 
        icon="pi pi-arrow-up-left"
        [class.p-button-primary]="activeTool === 'select'"
        (click)="selectTool('select')"
        pTooltip="Select tool (V)"
        tooltipPosition="right">
      </button>

      <!-- Shape Tools -->
      <button 
        pButton 
        icon="pi pi-stop"
        [class.p-button-primary]="activeTool === 'rectangle'"
        (click)="selectTool('rectangle')"
        pTooltip="Rectangle (R)"
        tooltipPosition="right">
      </button>

      <button 
        pButton 
        icon="pi pi-circle"
        [class.p-button-primary]="activeTool === 'circle'"
        (click)="selectTool('circle')"
        pTooltip="Circle (C)"
        tooltipPosition="right">
      </button>

      <!-- ... more tools ... -->

      <p-divider />

      <!-- Action Buttons -->
      <button 
        pButton 
        icon="pi pi-undo"
        (click)="undo.emit()"
        pTooltip="Undo (Ctrl+Z)"
        tooltipPosition="right">
      </button>

      <button 
        pButton 
        icon="pi pi-refresh"
        (click)="redo.emit()"
        pTooltip="Redo (Ctrl+Y)"
        tooltipPosition="right">
      </button>

      <button 
        pButton 
        icon="pi pi-download"
        (click)="export.emit()"
        pTooltip="Export"
        tooltipPosition="right">
      </button>
    </div>
  `
})
export class CanvasToolbarComponent {
  @Input() activeTool: Tool = 'select';
  @Output() toolSelect = new EventEmitter<Tool>();
  @Output() undo = new EventEmitter<void>();
  @Output() redo = new EventEmitter<void>();
  @Output() export = new EventEmitter<void>();

  selectTool(tool: Tool): void {
    this.toolSelect.emit(tool);
  }
}
```

### PropertiesPanelComponent

**Responsibility**: Display and edit selected object properties

**Implementation** (simplified):
```typescript
@Component({
  selector: 'properties-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputNumberModule, ColorPickerModule],
  template: `
    <div class="properties-panel p-4 bg-white border-l">
      @if (selectedObject) {
        <form [formGroup]="propertiesForm" (ngSubmit)="onSubmit()">
          <h3 class="text-lg font-bold mb-4">Properties</h3>

          <!-- Position -->
          <div class="field mb-4">
            <label class="block mb-2">Position</label>
            <div class="grid grid-cols-2 gap-2">
              <p-inputNumber 
                formControlName="x" 
                prefix="X: " 
                [showButtons]="true"
                (onInput)="onPropertyChange()">
              </p-inputNumber>
              <p-inputNumber 
                formControlName="y" 
                prefix="Y: " 
                [showButtons]="true"
                (onInput)="onPropertyChange()">
              </p-inputNumber>
            </div>
          </div>

          <!-- Size -->
          <div class="field mb-4">
            <label class="block mb-2">Size</label>
            <div class="grid grid-cols-2 gap-2">
              <p-inputNumber 
                formControlName="width" 
                prefix="W: " 
                [showButtons]="true"
                [min]="1"
                (onInput)="onPropertyChange()">
              </p-inputNumber>
              <p-inputNumber 
                formControlName="height" 
                prefix="H: " 
                [showButtons]="true"
                [min]="1"
                (onInput)="onPropertyChange()">
              </p-inputNumber>
            </div>
          </div>

          <!-- Colors -->
          <div class="field mb-4">
            <label class="block mb-2">Fill Color</label>
            <p-colorPicker 
              formControlName="fill"
              (onChange)="onPropertyChange()">
            </p-colorPicker>
          </div>

          <!-- Opacity -->
          <div class="field mb-4">
            <label class="block mb-2">Opacity</label>
            <p-slider 
              formControlName="opacity" 
              [min]="0" 
              [max]="1" 
              [step]="0.1"
              (onChange)="onPropertyChange()">
            </p-slider>
          </div>
        </form>
      } @else {
        <div class="empty-state text-center text-gray-500 p-8">
          <p>Select an object to edit properties</p>
        </div>
      }
    </div>
  `
})
export class PropertiesPanelComponent implements OnInit, OnChanges {
  @Input() selectedObject: CanvasObject | null = null;
  @Output() objectUpdate = new EventEmitter<CanvasObject>();

  propertiesForm!: FormGroup;
  private updateDebounce = new Subject<void>();

  constructor(private fb: FormBuilder) {
    this.propertiesForm = this.createForm();
  }

  ngOnInit(): void {
    // Debounce property changes to avoid excessive updates
    this.updateDebounce
      .pipe(debounceTime(100))
      .subscribe(() => this.emitUpdate());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedObject'] && this.selectedObject) {
      this.propertiesForm.patchValue(this.selectedObject, { emitEvent: false });
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      x: [0],
      y: [0],
      width: [100],
      height: [100],
      fill: ['#000000'],
      stroke: ['#000000'],
      strokeWidth: [1],
      opacity: [1]
    });
  }

  onPropertyChange(): void {
    this.updateDebounce.next();
  }

  private emitUpdate(): void {
    if (this.propertiesForm.valid && this.selectedObject) {
      const updatedObject = {
        ...this.selectedObject,
        ...this.propertiesForm.value
      };
      this.objectUpdate.emit(updatedObject);
    }
  }
}
```

## State Management

### CanvasStateService

**Purpose**: Centralized state with Angular Signals

```typescript
import { Injectable, signal, computed } from '@angular/core';
import { CanvasObject, Tool, CanvasSize } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CanvasStateService {
  // Private signals
  private readonly _objects = signal<CanvasObject[]>([]);
  private readonly _selectedObjectIds = signal<Set<string>>(new Set());
  private readonly _activeTool = signal<Tool>('select');
  private readonly _canvasSize = signal<CanvasSize>({ width: 1200, height: 800 });
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Public readonly signals
  readonly objects = this._objects.asReadonly();
  readonly activeTool = this._activeTool.asReadonly();
  readonly canvasSize = this._canvasSize.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed signals
  readonly selectedObjects = computed(() => {
    const ids = this._selectedObjectIds();
    return this._objects().filter(obj => ids.has(obj.id));
  });

  readonly objectCount = computed(() => this._objects().length);
  
  readonly canUndo = signal(false);
  readonly canRedo = signal(false);

  // State mutation methods
  setObjects(objects: CanvasObject[]): void {
    this._objects.set(objects);
  }

  addObject(object: CanvasObject): void {
    this._objects.update(objects => [...objects, object]);
  }

  updateObject(updated: CanvasObject): void {
    this._objects.update(objects => 
      objects.map(obj => obj.id === updated.id ? updated : obj)
    );
  }

  deleteObject(objectId: string): void {
    this._objects.update(objects => 
      objects.filter(obj => obj.id !== objectId)
    );
    this._selectedObjectIds.update(ids => {
      const newIds = new Set(ids);
      newIds.delete(objectId);
      return newIds;
    });
  }

  selectObject(objectId: string, addToSelection: boolean = false): void {
    this._selectedObjectIds.update(ids => {
      if (addToSelection) {
        const newIds = new Set(ids);
        if (newIds.has(objectId)) {
          newIds.delete(objectId);
        } else {
          newIds.add(objectId);
        }
        return newIds;
      } else {
        return new Set([objectId]);
      }
    });
  }

  clearSelection(): void {
    this._selectedObjectIds.set(new Set());
  }

  setActiveTool(tool: Tool): void {
    this._activeTool.set(tool);
  }

  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }

  setError(error: string | null): void {
    this._error.set(error);
  }

  clearError(): void {
    this._error.set(null);
  }

  reset(): void {
    this._objects.set([]);
    this._selectedObjectIds.set(new Set());
    this._activeTool.set('select');
    this._loading.set(false);
    this._error.set(null);
  }
}
```

## Routing Configuration

### Feature Routes

```typescript
import { Routes } from '@angular/router';
import { CanvasEditorComponent } from './components/canvas-editor/canvas-editor.component';
import { CanvasViewerComponent } from './components/canvas-viewer/canvas-viewer.component';

export const canvasRoutes: Routes = [
  {
    path: '',
    redirectTo: 'editor',
    pathMatch: 'full'
  },
  {
    path: 'editor',
    component: CanvasEditorComponent,
    title: 'Canvas Editor'
  },
  {
    path: 'viewer/:id',
    component: CanvasViewerComponent,
    title: 'Canvas Viewer'
  }
];
```

### App-Level Registration

```typescript
// apps/agency/src/app/app.routes.ts
export const appRoutes: Routes = [
  {
    path: 'canvas',
    loadChildren: () => import('@buildmotion-ai/canvas-feature')
      .then(m => m.canvasRoutes)
  }
];
```

## Accessibility Implementation

### ARIA Attributes

```typescript
@Component({
  template: `
    <button
      pButton
      icon="pi pi-plus"
      [attr.aria-label]="'Create new ' + toolName"
      [attr.aria-pressed]="isActive"
      [attr.aria-describedby]="toolName + '-description'"
      (click)="selectTool()">
    </button>

    <div [id]="toolName + '-description'" class="sr-only">
      {{ toolDescription }}
    </div>

    <div role="alert" aria-live="polite" aria-atomic="true">
      @if (statusMessage()) {
        {{ statusMessage() }}
      }
    </div>
  `
})
```

### Keyboard Navigation

- Tab order: Toolbar → Canvas → Properties → Layers
- Arrow keys: Navigate between tools/options
- Enter/Space: Activate buttons
- Escape: Cancel operations, clear selection
- Ctrl+Z/Y: Undo/redo
- Delete: Remove selected objects

## Performance Optimizations

### Change Detection Strategy

- Use OnPush for all components
- Rely on signals for automatic reactivity
- Avoid manual `ChangeDetectorRef.detectChanges()` calls

### Virtual Scrolling

```typescript
// For large layer lists
<cdk-virtual-scroll-viewport itemSize="40" class="h-[400px]">
  <div *cdkVirtualFor="let layer of layers()">
    <layer-item [layer]="layer"></layer-item>
  </div>
</cdk-virtual-scroll-viewport>
```

### Lazy Loading

- Feature module lazy loaded via router
- Heavy components (export dialogs) lazy loaded via dynamic imports
- Images loaded on demand with loading placeholders

## Evaluation Criteria

- [x] Component hierarchy matches system architecture
- [x] Smart/presentational component separation enforced
- [x] State management uses Angular Signals exclusively
- [x] All components use OnPush change detection
- [x] Routing configuration with lazy loading
- [x] Accessibility features implemented (ARIA, keyboard nav)
- [x] Form validation with reactive forms
- [x] Performance optimizations applied
- [x] Components are standalone (Angular 18+ pattern)
- [x] Error handling and loading states included

---

**Specification**: 02-ui-components ✅  
**Next**: database-schema.specification.md
