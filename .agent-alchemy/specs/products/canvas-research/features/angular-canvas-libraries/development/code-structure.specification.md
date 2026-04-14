---
meta:
  id: canvas-research-angular-canvas-libraries-code-structure-specification
  title: Code Structure - Canvas Libraries for Angular
  version: 1.0.0
  status: draft
  specType: specification
  scope: product:canvas-research
  tags: []
  createdBy: Agent Alchemy Developer v2.0.0
  createdAt: 2026-02-25T00:00:00.000Z
  reviewedAt: null
title: Code Structure - Canvas Libraries for Angular
category: Products
feature: angular-canvas-libraries
lastUpdated: '2026-03-12'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: canvas-research
phase: development
applyTo: []
keywords: []
topics: []
useCases: []
references:
  - .agent-alchemy/specs/frameworks/angular/
  - .agent-alchemy/specs/standards/coding-standards.specification.md
depends-on:
  - architecture/system-architecture.specification.md
  - architecture/ui-components.specification.md
  - plan/functional-requirements.specification.md
specification: 02-code-structure
---

# Code Structure: Canvas Libraries for Angular

## Overview

**Purpose**: Define comprehensive code organization, file structure, naming conventions, and module architecture for canvas library implementation.

**Approach**: Nx monorepo library structure with Angular 18+ standalone components, Signal-based state management, and clear separation of concerns.

**Philosophy**: Single Responsibility Principle (SRP), modular design, tree-shakeable imports, and testability-first structure.

---

## Repository Structure

### Nx Workspace Organization

```
buildmotion-ai-agency/
├── apps/
│   ├── agency/                      # Main Angular application
│   │   └── src/app/
│   │       └── canvas/              # Canvas feature integration (lazy loaded)
│   └── canvas-showcase/             # Demo/documentation app (optional)
├── libs/
│   ├── canvas-feature/              # ⭐ PRIMARY CANVAS LIBRARY
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── components/
│   │   │   │   ├── services/
│   │   │   │   ├── models/
│   │   │   │   ├── directives/
│   │   │   │   ├── pipes/
│   │   │   │   ├── guards/
│   │   │   │   ├── utils/
│   │   │   │   └── canvas-feature.routes.ts
│   │   │   ├── index.ts             # Public API barrel export
│   │   │   └── test-setup.ts        # Test configuration
│   │   ├── project.json
│   │   ├── tsconfig.json
│   │   ├── tsconfig.lib.json
│   │   ├── tsconfig.spec.json
│   │   ├── jest.config.ts
│   │   ├── .eslintrc.json
│   │   └── README.md
│   └── shared/                      # Shared utilities (if needed)
├── .agent-alchemy/specs/            # Specifications
├── nx.json
├── package.json
└── tsconfig.base.json
```

---

## Canvas Feature Library Structure

### Complete Directory Tree

```
libs/canvas-feature/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── canvas-editor/
│   │   │   │   ├── canvas-editor.component.ts
│   │   │   │   ├── canvas-editor.component.html
│   │   │   │   ├── canvas-editor.component.scss
│   │   │   │   └── canvas-editor.component.spec.ts
│   │   │   ├── canvas-viewer/
│   │   │   │   ├── canvas-viewer.component.ts
│   │   │   │   ├── canvas-viewer.component.html
│   │   │   │   ├── canvas-viewer.component.scss
│   │   │   │   └── canvas-viewer.component.spec.ts
│   │   │   ├── canvas-stage/
│   │   │   │   ├── canvas-stage.component.ts
│   │   │   │   ├── canvas-stage.component.html
│   │   │   │   ├── canvas-stage.component.scss
│   │   │   │   └── canvas-stage.component.spec.ts
│   │   │   ├── canvas-toolbar/
│   │   │   │   ├── canvas-toolbar.component.ts
│   │   │   │   ├── canvas-toolbar.component.html
│   │   │   │   ├── canvas-toolbar.component.scss
│   │   │   │   └── canvas-toolbar.component.spec.ts
│   │   │   ├── properties-panel/
│   │   │   │   ├── properties-panel.component.ts
│   │   │   │   ├── properties-panel.component.html
│   │   │   │   ├── properties-panel.component.scss
│   │   │   │   └── properties-panel.component.spec.ts
│   │   │   ├── layers-panel/
│   │   │   │   ├── layers-panel.component.ts
│   │   │   │   ├── layers-panel.component.html
│   │   │   │   ├── layers-panel.component.scss
│   │   │   │   ├── layers-panel.component.spec.ts
│   │   │   │   └── components/
│   │   │   │       └── layer-item/
│   │   │   │           ├── layer-item.component.ts
│   │   │   │           ├── layer-item.component.html
│   │   │   │           ├── layer-item.component.scss
│   │   │   │           └── layer-item.component.spec.ts
│   │   │   ├── export-dialog/
│   │   │   │   ├── export-dialog.component.ts
│   │   │   │   ├── export-dialog.component.html
│   │   │   │   ├── export-dialog.component.scss
│   │   │   │   └── export-dialog.component.spec.ts
│   │   │   └── shared/
│   │   │       ├── color-picker/
│   │   │       │   ├── color-picker.component.ts
│   │   │       │   ├── color-picker.component.html
│   │   │       │   ├── color-picker.component.scss
│   │   │       │   └── color-picker.component.spec.ts
│   │   │       └── icon-button/
│   │   │           ├── icon-button.component.ts
│   │   │           ├── icon-button.component.html
│   │   │           └── icon-button.component.spec.ts
│   │   ├── services/
│   │   │   ├── canvas.service.ts
│   │   │   ├── canvas.service.spec.ts
│   │   │   ├── canvas-state.service.ts
│   │   │   ├── canvas-state.service.spec.ts
│   │   │   ├── canvas-history.service.ts
│   │   │   ├── canvas-history.service.spec.ts
│   │   │   ├── canvas-export.service.ts
│   │   │   ├── canvas-export.service.spec.ts
│   │   │   ├── canvas-storage.service.ts
│   │   │   ├── canvas-storage.service.spec.ts
│   │   │   ├── validation.service.ts
│   │   │   ├── validation.service.spec.ts
│   │   │   └── index.ts              # Service barrel exports
│   │   ├── models/
│   │   │   ├── canvas-object.model.ts
│   │   │   ├── canvas-state.model.ts
│   │   │   ├── tool.model.ts
│   │   │   ├── layer.model.ts
│   │   │   ├── export-options.model.ts
│   │   │   ├── validation.model.ts
│   │   │   └── index.ts              # Model barrel exports
│   │   ├── directives/
│   │   │   ├── canvas-drag.directive.ts
│   │   │   ├── canvas-drag.directive.spec.ts
│   │   │   ├── canvas-resize.directive.ts
│   │   │   ├── canvas-resize.directive.spec.ts
│   │   │   ├── canvas-rotate.directive.ts
│   │   │   ├── canvas-rotate.directive.spec.ts
│   │   │   └── index.ts
│   │   ├── pipes/
│   │   │   ├── canvas-object-type.pipe.ts
│   │   │   ├── canvas-object-type.pipe.spec.ts
│   │   │   ├── format-dimension.pipe.ts
│   │   │   ├── format-dimension.pipe.spec.ts
│   │   │   └── index.ts
│   │   ├── guards/
│   │   │   ├── canvas-loaded.guard.ts
│   │   │   ├── canvas-loaded.guard.spec.ts
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── canvas-utils.ts
│   │   │   ├── canvas-utils.spec.ts
│   │   │   ├── geometry-utils.ts
│   │   │   ├── geometry-utils.spec.ts
│   │   │   ├── color-utils.ts
│   │   │   ├── color-utils.spec.ts
│   │   │   ├── export-utils.ts
│   │   │   ├── export-utils.spec.ts
│   │   │   └── index.ts
│   │   ├── constants/
│   │   │   ├── canvas-constants.ts
│   │   │   ├── tool-constants.ts
│   │   │   ├── validation-constants.ts
│   │   │   └── index.ts
│   │   └── canvas-feature.routes.ts
│   ├── index.ts                    # Public API (barrel export)
│   └── test-setup.ts
├── assets/                         # Library-specific assets
│   ├── icons/
│   └── styles/
│       └── canvas-theme.scss
├── project.json
├── tsconfig.json
├── tsconfig.lib.json
├── tsconfig.spec.json
├── jest.config.ts
├── .eslintrc.json
├── ng-package.json
└── README.md
```

---

## Naming Conventions

### File Naming

**Pattern**: `{feature-name}.{type}.{ext}`

**Examples**:
- Components: `canvas-editor.component.ts`, `canvas-toolbar.component.html`
- Services: `canvas-state.service.ts`, `canvas-export.service.ts`
- Models: `canvas-object.model.ts`, `layer.model.ts`
- Directives: `canvas-drag.directive.ts`
- Pipes: `format-dimension.pipe.ts`
- Guards: `canvas-loaded.guard.ts`
- Utils: `canvas-utils.ts`, `geometry-utils.ts`
- Constants: `canvas-constants.ts`, `tool-constants.ts`
- Tests: `{feature-name}.{type}.spec.ts`

**Case Convention**: kebab-case (lowercase with hyphens)

### Class Naming

**Pattern**: `{FeatureName}{Type}`

**Examples**:
- Components: `CanvasEditorComponent`, `CanvasToolbarComponent`
- Services: `CanvasStateService`, `CanvasExportService`
- Directives: `CanvasDragDirective`, `CanvasResizeDirective`
- Pipes: `CanvasObjectTypePipe`, `FormatDimensionPipe`
- Guards: `CanvasLoadedGuard`
- Models/Interfaces: `CanvasObject`, `Layer`, `Tool`

**Case Convention**: PascalCase

### Variable & Function Naming

**Patterns**:
- Variables: camelCase (`selectedObjects`, `activeTool`, `canvasSize`)
- Constants: UPPER_SNAKE_CASE (`MAX_OBJECT_COUNT`, `DEFAULT_CANVAS_WIDTH`)
- Functions: camelCase with verb prefix (`createObject`, `updateObject`, `validateDimensions`)
- Boolean variables: `is*`, `has*`, `can*`, `should*` prefix (`isDrawing`, `hasSelection`, `canUndo`)
- Event handlers: `on*` prefix (`onStageClick`, `onObjectDragEnd`)
- Signal variables: Plain camelCase (`objects`, `selectedObjects`, `loading`)

---

## Module Organization

### Public API (Barrel Exports)

**File**: `libs/canvas-feature/src/index.ts`

```typescript
// Components (public API)
export * from './lib/components/canvas-editor/canvas-editor.component';
export * from './lib/components/canvas-viewer/canvas-viewer.component';
export * from './lib/components/canvas-toolbar/canvas-toolbar.component';
export * from './lib/components/properties-panel/properties-panel.component';
export * from './lib/components/layers-panel/layers-panel.component';

// Services (public API)
export * from './lib/services/canvas.service';
export * from './lib/services/canvas-state.service';
export * from './lib/services/canvas-history.service';
export * from './lib/services/canvas-export.service';
export * from './lib/services/validation.service';

// Models (public API)
export * from './lib/models';

// Directives (public API)
export * from './lib/directives';

// Pipes (public API)
export * from './lib/pipes';

// Routes (public API)
export * from './lib/canvas-feature.routes';

// Constants (public API)
export * from './lib/constants';
```

### Service Barrel Exports

**File**: `libs/canvas-feature/src/lib/services/index.ts`

```typescript
export * from './canvas.service';
export * from './canvas-state.service';
export * from './canvas-history.service';
export * from './canvas-export.service';
export * from './canvas-storage.service';
export * from './validation.service';
```

### Model Barrel Exports

**File**: `libs/canvas-feature/src/lib/models/index.ts`

```typescript
export * from './canvas-object.model';
export * from './canvas-state.model';
export * from './tool.model';
export * from './layer.model';
export * from './export-options.model';
export * from './validation.model';
```

---

## Component Structure

### Component Template

**Standard Component Structure**:

```typescript
import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
// PrimeNG imports
import { ButtonModule } from 'primeng/button';
// Local imports
import { CanvasService } from '../../services/canvas.service';
import { CanvasObject, Tool } from '../../models';

/**
 * Component description
 * 
 * @example
 * ```html
 * <canvas-toolbar
 *   [activeTool]="activeTool()"
 *   (toolSelect)="onToolSelect($event)">
 * </canvas-toolbar>
 * ```
 */
@Component({
  selector: 'canvas-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule
  ],
  templateUrl: './canvas-toolbar.component.html',
  styleUrls: ['./canvas-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CanvasToolbarComponent implements OnInit, OnDestroy {
  // Injected services (private readonly)
  private readonly canvasService = inject(CanvasService);
  
  // Input properties
  @Input() activeTool: Tool = 'select';
  @Input() canUndo = false;
  @Input() canRedo = false;
  
  // Output properties
  @Output() toolSelect = new EventEmitter<Tool>();
  @Output() undo = new EventEmitter<void>();
  @Output() redo = new EventEmitter<void>();
  
  // Public signals
  readonly isExpanded = signal(true);
  readonly toolCount = computed(() => this.tools.length);
  
  // Public properties
  readonly tools: Tool[] = ['select', 'rectangle', 'circle', 'line'];
  
  // Private signals
  private readonly internalState = signal<any>(null);

  ngOnInit(): void {
    // Initialization logic
  }

  ngOnDestroy(): void {
    // Cleanup logic
  }

  // Public methods
  selectTool(tool: Tool): void {
    this.toolSelect.emit(tool);
  }

  // Private methods
  private initializeToolbar(): void {
    // Private initialization
  }
}
```

### Component File Order

**Consistent class member order**:

1. Injected services (private readonly)
2. Input properties (@Input)
3. Output properties (@Output)
4. Public signals (readonly)
5. Public computed signals (readonly)
6. Public properties
7. Private signals
8. Private properties
9. Constructor (if needed, otherwise use inject())
10. Lifecycle hooks (ngOnInit, ngOnChanges, ngOnDestroy, etc.)
11. Public methods (alphabetical)
12. Private methods (alphabetical)

---

## Service Structure

### Service Template

**Standard Service Structure**:

```typescript
import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, tap, catchError, delay } from 'rxjs/operators';
// Local imports
import { CanvasObject, ValidationResult } from '../models';

/**
 * Service description
 * 
 * Responsibilities:
 * - List responsibilities
 * - One per line
 * 
 * @example
 * ```typescript
 * constructor(private canvasService: CanvasService) {}
 * 
 * this.canvasService.createObject(params)
 *   .subscribe(object => console.log(object));
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class CanvasService {
  // Injected dependencies (private readonly)
  private readonly validationService = inject(ValidationService);
  
  // Private signals for internal state
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  
  // Public readonly signals
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  
  // Public computed signals
  readonly isReady = computed(() => !this._loading() && !this._error());

  // Public methods returning Observables
  createObject(params: CreateObjectParams): Observable<CanvasObject> {
    // Validation
    const validation = this.validationService.validateObjectCreation(params);
    if (!validation.valid) {
      return throwError(() => ({
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.errors[0].message,
          details: validation.errors
        }
      }));
    }

    // Implementation
    this._loading.set(true);
    
    return of(this.buildObject(params)).pipe(
      delay(10), // Simulate async
      tap(obj => this.onObjectCreated(obj)),
      catchError(error => this.handleError(error)),
      tap(() => this._loading.set(false))
    );
  }

  // Public synchronous methods
  setError(error: string): void {
    this._error.set(error);
  }

  clearError(): void {
    this._error.set(null);
  }

  // Private methods
  private buildObject(params: CreateObjectParams): CanvasObject {
    // Build logic
    return {} as CanvasObject;
  }

  private onObjectCreated(object: CanvasObject): void {
    // Post-creation logic
  }

  private handleError(error: any): Observable<never> {
    this._error.set(error.message || 'An error occurred');
    this._loading.set(false);
    return throwError(() => error);
  }
}
```

---

## Model Structure

### Interface Definitions

**Standard Model Structure**:

```typescript
/**
 * Represents a canvas object (shape, text, image)
 * 
 * @interface CanvasObject
 * @property {string} id - Unique identifier (UUID)
 * @property {CanvasObjectType} type - Type of object
 * @property {string} layerId - ID of parent layer
 */
export interface CanvasObject {
  // Core identity
  id: string;
  type: CanvasObjectType;
  layerId: string;
  
  // Position
  x: number;
  y: number;
  
  // Dimensions (shape-dependent)
  width?: number;
  height?: number;
  radius?: number;
  
  // Styling
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  
  // Transformation
  rotation: number;
  scaleX: number;
  scaleY: number;
  
  // State
  locked: boolean;
  visible: boolean;
  draggable: boolean;
  
  // Metadata
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Type guard to check if object is a specific type
 */
export function isRectangle(obj: CanvasObject): obj is CanvasObject & { width: number; height: number } {
  return obj.type === 'rectangle' && obj.width !== undefined && obj.height !== undefined;
}

/**
 * Factory function to create default object
 */
export function createDefaultCanvasObject(type: CanvasObjectType): Partial<CanvasObject> {
  return {
    type,
    fill: '#000000',
    stroke: '#000000',
    strokeWidth: 1,
    opacity: 1,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    locked: false,
    visible: true,
    draggable: true,
    metadata: {}
  };
}
```

### Type Definitions

```typescript
/**
 * Union type for canvas object types
 */
export type CanvasObjectType = 
  | 'rectangle' 
  | 'circle' 
  | 'ellipse'
  | 'line' 
  | 'polygon' 
  | 'text' 
  | 'image' 
  | 'path'
  | 'group';

/**
 * Union type for drawing tools
 */
export type Tool = 
  | 'select'
  | 'rectangle'
  | 'circle'
  | 'ellipse'
  | 'line'
  | 'polygon'
  | 'text'
  | 'image'
  | 'path'
  | 'pan'
  | 'zoom';

/**
 * Type alias for validation result
 */
export type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
};
```

---

## Constants Organization

### Canvas Constants

**File**: `libs/canvas-feature/src/lib/constants/canvas-constants.ts`

```typescript
/**
 * Maximum number of objects allowed on a canvas (BR-C-001)
 */
export const MAX_OBJECT_COUNT = 10_000;

/**
 * Warning threshold for object count (BR-P-001)
 */
export const OBJECT_COUNT_WARNING_THRESHOLD = 5_000;

/**
 * Critical warning threshold for object count (BR-P-001)
 */
export const OBJECT_COUNT_CRITICAL_THRESHOLD = 8_000;

/**
 * Default canvas dimensions
 */
export const DEFAULT_CANVAS_WIDTH = 1200;
export const DEFAULT_CANVAS_HEIGHT = 800;

/**
 * Minimum canvas dimensions (BR-C-002)
 */
export const MIN_CANVAS_WIDTH = 50;
export const MIN_CANVAS_HEIGHT = 50;

/**
 * Maximum canvas dimensions (BR-C-002)
 */
export const MAX_CANVAS_WIDTH = 20_000;
export const MAX_CANVAS_HEIGHT = 20_000;

/**
 * Auto-save interval in milliseconds (BR-S-002)
 */
export const AUTO_SAVE_INTERVAL_MS = 60_000; // 60 seconds

/**
 * Maximum undo stack size (BR-S-001)
 */
export const MAX_UNDO_STACK_SIZE = 50;
```

### Validation Constants

**File**: `libs/canvas-feature/src/lib/constants/validation-constants.ts`

```typescript
/**
 * File upload validation constants (BR-V-001)
 */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_IMAGE_DIMENSION_PX = 8192;
export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
export const ALLOWED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];

/**
 * Object dimension validation (BR-C-002)
 */
export const MIN_OBJECT_DIMENSION_PX = 1;
export const MAX_OBJECT_DIMENSION_PX = 10_000;

/**
 * Text content validation (BR-C-004)
 */
export const MAX_TEXT_LENGTH = 10_000;
export const MAX_TEXT_LINES = 1_000;
export const MIN_FONT_SIZE_PT = 6;
export const MAX_FONT_SIZE_PT = 500;

/**
 * Scale limits (BR-M-002)
 */
export const MIN_SCALE = 0.01;
export const MAX_SCALE = 100;

/**
 * Layer limits (BR-L-001)
 */
export const MAX_LAYER_COUNT = 100;
```

---

## Utility Functions Organization

### Canvas Utilities

**File**: `libs/canvas-feature/src/lib/utils/canvas-utils.ts`

```typescript
import { CanvasObject } from '../models';

/**
 * Generate a unique ID for canvas objects
 * Uses UUID v4 format
 */
export function generateObjectId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Calculate bounding box for multiple objects
 */
export function calculateBoundingBox(objects: CanvasObject[]): { 
  x: number; 
  y: number; 
  width: number; 
  height: number 
} {
  if (objects.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const xs = objects.map(obj => obj.x);
  const ys = objects.map(obj => obj.y);
  const x2s = objects.map(obj => obj.x + (obj.width || 0));
  const y2s = objects.map(obj => obj.y + (obj.height || 0));

  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...x2s);
  const maxY = Math.max(...y2s);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

/**
 * Check if point is inside object bounds
 */
export function isPointInObject(
  point: { x: number; y: number }, 
  object: CanvasObject
): boolean {
  const { x, y, width = 0, height = 0 } = object;
  return (
    point.x >= x &&
    point.x <= x + width &&
    point.y >= y &&
    point.y <= y + height
  );
}
```

### Geometry Utilities

**File**: `libs/canvas-feature/src/lib/utils/geometry-utils.ts`

```typescript
/**
 * Calculate distance between two points
 */
export function distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Calculate angle between two points in degrees
 */
export function angleBetweenPoints(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  const radians = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  return radians * (180 / Math.PI);
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Round to nearest grid point
 */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}
```

### Color Utilities

**File**: `libs/canvas-feature/src/lib/utils/color-utils.ts`

```typescript
/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Convert RGB to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Validate hex color format
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color);
}

/**
 * Generate random color
 */
export function randomColor(): string {
  return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
}
```

---

## Testing Structure

### Unit Test Organization

**Test File Template**:

```typescript
import { TestBed } from '@angular/core/testing';
import { CanvasStateService } from './canvas-state.service';
import { CanvasObject } from '../models';

describe('CanvasStateService', () => {
  let service: CanvasStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CanvasStateService]
    });
    service = TestBed.inject(CanvasStateService);
  });

  afterEach(() => {
    // Cleanup if needed
    service.reset();
  });

  describe('initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have empty objects array initially', () => {
      expect(service.objects()).toEqual([]);
      expect(service.objectCount()).toBe(0);
    });

    it('should have default layer', () => {
      expect(service.layers()).toHaveLength(1);
      expect(service.layers()[0].name).toBe('Layer 1');
    });
  });

  describe('object management', () => {
    let mockObject: CanvasObject;

    beforeEach(() => {
      mockObject = createMockCanvasObject();
    });

    it('should add object to state', () => {
      service.addObject(mockObject);
      
      expect(service.objectCount()).toBe(1);
      expect(service.objects()[0]).toEqual(mockObject);
    });

    it('should update existing object', () => {
      service.addObject(mockObject);
      const updated = { ...mockObject, x: 200 };
      
      service.updateObject(updated);
      
      expect(service.objects()[0].x).toBe(200);
    });

    it('should delete object', () => {
      service.addObject(mockObject);
      expect(service.objectCount()).toBe(1);
      
      service.deleteObject(mockObject.id);
      
      expect(service.objectCount()).toBe(0);
    });
  });

  describe('selection management', () => {
    it('should select single object', () => {
      service.selectObject('test-id');
      
      expect(service.hasSelection()).toBe(true);
    });

    it('should add to selection', () => {
      service.selectObject('test-1');
      service.selectObject('test-2', true);
      
      expect(service.selectedObjects()).toHaveLength(2);
    });

    it('should clear selection', () => {
      service.selectObject('test-1');
      service.clearSelection();
      
      expect(service.hasSelection()).toBe(false);
    });
  });
});

// Test helper functions
function createMockCanvasObject(overrides: Partial<CanvasObject> = {}): CanvasObject {
  return {
    id: 'test-1',
    type: 'rectangle',
    layerId: 'default',
    x: 100,
    y: 100,
    width: 200,
    height: 150,
    fill: '#FF0000',
    stroke: '#000000',
    strokeWidth: 1,
    opacity: 1,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
    skewY: 0,
    locked: false,
    visible: true,
    draggable: true,
    zIndex: 0,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}
```

### E2E Test Organization

**File**: `apps/canvas-feature-e2e/src/e2e/canvas-editor.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Canvas Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/canvas/editor');
    await page.waitForSelector('canvas-editor');
  });

  test('should load canvas editor', async ({ page }) => {
    await expect(page.locator('canvas-editor')).toBeVisible();
    await expect(page.locator('canvas-toolbar')).toBeVisible();
    await expect(page.locator('canvas-stage')).toBeVisible();
  });

  test('should create rectangle on drag', async ({ page }) => {
    // Select rectangle tool
    await page.click('[data-testid="tool-rectangle"]');
    
    // Drag to create rectangle
    const canvas = page.locator('canvas').first();
    await canvas.click({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await page.mouse.move(300, 250);
    await page.mouse.up();
    
    // Verify object created
    await expect(page.locator('[data-testid="object-count"]')).toHaveText('1');
  });

  test('should undo rectangle creation', async ({ page }) => {
    // Create rectangle (same as above)
    await page.click('[data-testid="tool-rectangle"]');
    const canvas = page.locator('canvas').first();
    await canvas.click({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await page.mouse.move(300, 250);
    await page.mouse.up();
    
    // Undo
    await page.keyboard.press('Control+Z');
    
    // Verify object removed
    await expect(page.locator('[data-testid="object-count"]')).toHaveText('0');
  });
});
```

---

## Import Guidelines

### Import Order

**Standard import order**:

1. Angular core imports
2. Angular common imports  
3. RxJS imports
4. Third-party library imports (PrimeNG, ng2-konva)
5. Local service imports
6. Local model imports
7. Local utility imports
8. Local constant imports

**Example**:

```typescript
// 1. Angular core
import { Component, OnInit, inject, signal } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';

// 2. Angular common
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

// 3. RxJS
import { Observable, Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

// 4. Third-party
import { ButtonModule } from 'primeng/button';
import { KonvaModule } from 'ng2-konva';

// 5. Local services
import { CanvasService } from '../../services/canvas.service';
import { CanvasStateService } from '../../services/canvas-state.service';

// 6. Local models
import { CanvasObject, Tool, Layer } from '../../models';

// 7. Local utilities
import { generateObjectId, calculateBoundingBox } from '../../utils/canvas-utils';

// 8. Local constants
import { MAX_OBJECT_COUNT, DEFAULT_CANVAS_WIDTH } from '../../constants/canvas-constants';
```

### Path Aliases

**Use TypeScript path aliases from tsconfig.base.json**:

```typescript
// ❌ Bad: Relative imports
import { CanvasService } from '../../../../../libs/canvas-feature/src/lib/services/canvas.service';

// ✅ Good: Path alias
import { CanvasService } from '@buildmotion-ai/canvas-feature';
```

---

## Code Quality Standards

### TypeScript Configuration

**File**: `libs/canvas-feature/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": false,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "files": [],
  "include": [],
  "references": [
    {
      "path": "./tsconfig.lib.json"
    },
    {
      "path": "./tsconfig.spec.json"
    }
  ],
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  }
}
```

### ESLint Configuration

**File**: `libs/canvas-feature/.eslintrc.json`

```json
{
  "extends": ["../../.eslintrc.json"],
  "ignorePatterns": ["!**/*"],
  "overrides": [
    {
      "files": ["*.ts"],
      "rules": {
        "@angular-eslint/directive-selector": [
          "error",
          {
            "type": "attribute",
            "prefix": "canvas",
            "style": "camelCase"
          }
        ],
        "@angular-eslint/component-selector": [
          "error",
          {
            "type": "element",
            "prefix": "canvas",
            "style": "kebab-case"
          }
        ],
        "@typescript-eslint/explicit-function-return-type": "error",
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/naming-convention": [
          "error",
          {
            "selector": "interface",
            "format": ["PascalCase"]
          }
        ]
      }
    },
    {
      "files": ["*.html"],
      "rules": {}
    }
  ]
}
```

---

## Documentation Standards

### JSDoc Comments

**Service Method Documentation**:

```typescript
/**
 * Creates a new canvas object with the specified parameters.
 * Validates object count limit (BR-C-001) and dimensions (BR-C-002).
 * 
 * @param params - Object creation parameters
 * @returns Observable emitting the created object
 * @throws {ValidationError} If parameters are invalid
 * @throws {ObjectLimitError} If canvas object limit exceeded
 * 
 * @example
 * ```typescript
 * const params: CreateObjectParams = {
 *   type: 'rectangle',
 *   x: 100,
 *   y: 100,
 *   width: 200,
 *   height: 150
 * };
 * 
 * this.canvasService.createObject(params)
 *   .subscribe({
 *     next: object => console.log('Created:', object),
 *     error: err => console.error('Error:', err)
 *   });
 * ```
 */
createObject(params: CreateObjectParams): Observable<CanvasObject> {
  // Implementation
}
```

**Interface Documentation**:

```typescript
/**
 * Represents a canvas object (shape, text, image).
 * All canvas objects must have a unique ID and belong to a layer.
 * 
 * @interface CanvasObject
 * @see {@link Layer} for layer information
 * @see {@link CanvasObjectType} for object types
 * 
 * @example
 * ```typescript
 * const rectangle: CanvasObject = {
 *   id: uuidv4(),
 *   type: 'rectangle',
 *   layerId: 'default',
 *   x: 100,
 *   y: 100,
 *   width: 200,
 *   height: 150,
 *   fill: '#FF0000',
 *   // ... other properties
 * };
 * ```
 */
export interface CanvasObject {
  /**
   * Unique identifier for the object (UUID v4 format).
   * Generated automatically on creation.
   */
  id: string;
  
  /**
   * Type of canvas object.
   * Determines which properties are required/optional.
   */
  type: CanvasObjectType;
  
  // ... rest of properties with JSDoc
}
```

---

## Evaluation Checklist

**Code Structure Compliance**:

- [ ] File naming follows kebab-case convention
- [ ] Class naming follows PascalCase convention
- [ ] Variable naming follows camelCase convention
- [ ] Constants use UPPER_SNAKE_CASE
- [ ] Directory structure matches specification
- [ ] Barrel exports implemented for all modules
- [ ] Public API clearly defined in index.ts
- [ ] Components use ChangeDetectionStrategy.OnPush
- [ ] Services use providedIn: 'root'
- [ ] All classes have JSDoc documentation
- [ ] Import order follows guidelines
- [ ] Path aliases used (no relative imports)
- [ ] TypeScript strict mode enabled
- [ ] ESLint rules enforced
- [ ] Unit tests co-located with source files
- [ ] Test coverage ≥ 80%

---

**Specification Complete**: 02-code-structure ✅  
**Next**: development-environment.specification.md
