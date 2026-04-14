---
meta:
  id: canvas-research-angular-canvas-libraries-integration-points-specification
  title: Integration Points - Canvas Libraries for Angular
  version: 1.0.0
  status: draft
  specType: specification
  scope: product:canvas-research
  tags: []
  createdBy: Agent Alchemy Developer v2.0.0
  createdAt: 2026-02-25T00:00:00.000Z
  reviewedAt: null
title: Integration Points - Canvas Libraries for Angular
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
  - plan/functional-requirements.specification.md
  - plan/business-rules.specification.md
depends-on:
  - architecture/api-specifications.specification.md
  - architecture/system-architecture.specification.md
  - architecture/business-logic.specification.md
specification: 04-integration-points
---

# Integration Points: Canvas Libraries for Angular

## Overview

**Purpose**: Define all integration points, service APIs, event flows, error handling patterns, and external dependencies for canvas library integration.

**Scope**: Internal service integration, ng2-konva library integration, browser APIs, future cloud sync integration, and error handling patterns.

**Integration Types**:
- Service-to-service communication
- Component-to-service communication
- ng2-konva library integration
- Browser API integration (Canvas, IndexedDB, File API)
- Future: Supabase cloud sync

---

## Service Integration Architecture

### Service Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  CanvasEditorComponent (Container)                           │
│  ├─ Injects: CanvasService                                   │
│  ├─ Injects: CanvasHistoryService                            │
│  ├─ Injects: CanvasExportService                             │
│  └─ Subscribes to: CanvasStateService signals                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  CanvasService (Orchestration)                               │
│  ├─ Injects: CanvasStateService                              │
│  ├─ Injects: ValidationService                               │
│  ├─ Injects: CanvasHistoryService                            │
│  └─ Coordinates: Object operations, validation, history      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌──────────────────┐  ┌───────────────────┐
│                 │  │                  │  │                   │
│ CanvasState     │  │ Validation       │  │ CanvasHistory     │
│ Service         │  │ Service          │  │ Service           │
│                 │  │                  │  │                   │
│ - State Mgmt    │  │ - BR validation  │  │ - Undo/Redo       │
│ - Signals       │  │ - Input checks   │  │ - History stack   │
│                 │  │                  │  │                   │
└─────────────────┘  └──────────────────┘  └───────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  CanvasStorageService (Persistence)                          │
│  ├─ IndexedDB integration                                    │
│  ├─ Auto-save timer                                          │
│  └─ Future: Supabase sync                                    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Service APIs

### CanvasService API

**Purpose**: Primary orchestration service for canvas operations.

**Public Methods**:

```typescript
export interface CanvasServiceAPI {
  // Object Operations
  createObject(params: CreateObjectParams): Observable<CanvasObject>;
  updateObject(object: CanvasObject): Observable<CanvasObject>;
  deleteObject(objectId: string): Observable<void>;
  deleteSelected(): Observable<void>;
  duplicateObject(objectId: string): Observable<CanvasObject>;
  
  // Selection Operations
  selectObject(objectId: string, addToSelection?: boolean): void;
  selectMultiple(objectIds: string[]): void;
  clearSelection(): void;
  selectAll(): void;
  
  // Transformation Operations
  moveObject(objectId: string, delta: { x: number; y: number }): void;
  resizeObject(objectId: string, size: { width: number; height: number }): void;
  rotateObject(objectId: string, angle: number): void;
  
  // Layer Operations
  createLayer(name: string): Observable<Layer>;
  deleteLayer(layerId: string): Observable<void>;
  moveToLayer(objectId: string, layerId: string): void;
  reorderLayers(layerIds: string[]): void;
  
  // Canvas Operations
  clearCanvas(): void;
  resetCanvas(): void;
  
  // Tool Management
  setActiveTool(tool: Tool): void;
  
  // State Management
  save(): Observable<void>;
  load(canvasId: string): Observable<CanvasSnapshot>;
  exportCanvas(): Observable<CanvasSnapshot>;
}
```

**Usage Pattern**:

```typescript
@Component({
  selector: 'canvas-editor',
  standalone: true
})
export class CanvasEditorComponent {
  private readonly canvasService = inject(CanvasService);
  private readonly notificationService = inject(NotificationService);

  createRectangle(): void {
    const params: CreateObjectParams = {
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 200,
      height: 150
    };

    this.canvasService.createObject(params)
      .pipe(
        catchError(error => this.handleError(error))
      )
      .subscribe({
        next: (object) => {
          console.log('Rectangle created:', object.id);
          this.notificationService.success('Rectangle created');
        }
      });
  }

  private handleError(error: any): Observable<never> {
    this.notificationService.error(error.error.message);
    return throwError(() => error);
  }
}
```

### CanvasStateService API

**Purpose**: Centralized state management with Angular Signals.

**Public Signals**:

```typescript
export interface CanvasStateServiceAPI {
  // Read-only signals
  readonly objects: Signal<CanvasObject[]>;
  readonly activeTool: Signal<Tool>;
  readonly canvasSize: Signal<CanvasSize>;
  readonly layers: Signal<Layer[]>;
  readonly loading: Signal<boolean>;
  readonly error: Signal<string | null>;
  
  // Computed signals
  readonly selectedObjects: Signal<CanvasObject[]>;
  readonly objectCount: Signal<number>;
  readonly hasSelection: Signal<boolean>;
  readonly singleSelection: Signal<CanvasObject | null>;
  
  // State mutation methods
  setObjects(objects: CanvasObject[]): void;
  addObject(object: CanvasObject): void;
  updateObject(updated: CanvasObject): void;
  deleteObject(objectId: string): void;
  
  selectObject(objectId: string, addToSelection?: boolean): void;
  clearSelection(): void;
  
  setActiveTool(tool: Tool): void;
  setCanvasSize(size: CanvasSize): void;
  
  addLayer(layer: Layer): void;
  updateLayer(updated: Layer): void;
  deleteLayer(layerId: string): void;
  
  setLoading(loading: boolean): void;
  setError(error: string | null): void;
  clearError(): void;
  
  reset(): void;
}
```

**Usage Pattern (Signal-based)**:

```typescript
@Component({
  selector: 'canvas-toolbar',
  standalone: true,
  template: `
    <div class="toolbar">
      <p>Objects: {{ objectCount() }}</p>
      <p>Selected: {{ selectedObjects().length }}</p>
      <p>Tool: {{ activeTool() }}</p>
      
      @if (loading()) {
        <p-progressSpinner />
      }
      
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
    </div>
  `
})
export class CanvasToolbarComponent {
  private readonly stateService = inject(CanvasStateService);

  // Expose signals for template
  readonly objectCount = this.stateService.objectCount;
  readonly selectedObjects = this.stateService.selectedObjects;
  readonly activeTool = this.stateService.activeTool;
  readonly loading = this.stateService.loading;
  readonly error = this.stateService.error;
}
```

### CanvasHistoryService API

**Purpose**: Undo/redo functionality with action history.

**Public Methods**:

```typescript
export interface CanvasHistoryServiceAPI {
  // History operations
  undo(): Observable<boolean>;
  redo(): Observable<boolean>;
  
  // History state (signals)
  readonly canUndo: Signal<boolean>;
  readonly canRedo: Signal<boolean>;
  readonly historySize: Signal<number>;
  
  // History management
  recordAction(action: HistoryAction, state?: CanvasSnapshot): void;
  clearHistory(): void;
  setMaxHistorySize(size: number): void;
}
```

**Usage Pattern**:

```typescript
@Component({
  selector: 'canvas-editor',
  standalone: true
})
export class CanvasEditorComponent {
  private readonly historyService = inject(CanvasHistoryService);
  
  readonly canUndo = this.historyService.canUndo;
  readonly canRedo = this.historyService.canRedo;

  @HostListener('window:keydown.control.z', ['$event'])
  @HostListener('window:keydown.meta.z', ['$event'])
  onUndo(event: KeyboardEvent): void {
    event.preventDefault();
    this.historyService.undo().subscribe(success => {
      if (success) {
        console.log('Undo successful');
      }
    });
  }

  @HostListener('window:keydown.control.y', ['$event'])
  @HostListener('window:keydown.meta.shift.z', ['$event'])
  onRedo(event: KeyboardEvent): void {
    event.preventDefault();
    this.historyService.redo().subscribe(success => {
      if (success) {
        console.log('Redo successful');
      }
    });
  }

  onObjectMove(object: CanvasObject, beforeState: Partial<CanvasObject>): void {
    // Record action for undo/redo
    this.historyService.recordAction({
      type: 'move',
      objectId: object.id,
      before: beforeState,
      after: { x: object.x, y: object.y },
      timestamp: new Date()
    });
  }
}
```

### ValidationService API

**Purpose**: Business rule validation (BR-C-*, BR-V-*, BR-M-*).

**Public Methods**:

```typescript
export interface ValidationServiceAPI {
  // Object validation
  validateObjectCreation(params: CreateObjectParams): ValidationResult;
  validateObjectUpdate(object: CanvasObject): ValidationResult;
  validateDimensions(width: number, height: number): ValidationResult;
  validateFileUpload(file: File): ValidationResult;
  
  // Canvas validation
  validateObjectCount(currentCount: number): ValidationResult;
  validateCanvasSize(width: number, height: number): ValidationResult;
  validateMemoryUsage(): Observable<ValidationResult>;
  
  // Property validation
  validateColor(color: string): boolean;
  validateOpacity(opacity: number): boolean;
  validateStrokeWidth(width: number): boolean;
  validateFontSize(size: number): boolean;
}
```

**Usage Pattern**:

```typescript
@Injectable({ providedIn: 'root' })
export class CanvasService {
  private readonly validationService = inject(ValidationService);
  private readonly stateService = inject(CanvasStateService);

  createObject(params: CreateObjectParams): Observable<CanvasObject> {
    // Validate object count (BR-C-001)
    const countValidation = this.validationService.validateObjectCount(
      this.stateService.objectCount()
    );
    
    if (!countValidation.valid) {
      return throwError(() => ({
        error: {
          code: 'OBJECT_LIMIT_EXCEEDED',
          message: countValidation.errors[0].message,
          details: countValidation.errors
        }
      }));
    }

    // Validate dimensions (BR-C-002)
    const dimensionValidation = this.validationService.validateDimensions(
      params.width || 0,
      params.height || 0
    );
    
    if (!dimensionValidation.valid) {
      return throwError(() => ({
        error: {
          code: 'INVALID_DIMENSIONS',
          message: dimensionValidation.errors[0].message,
          details: dimensionValidation.errors
        }
      }));
    }

    // Create object if validation passes
    return of(this.buildObject(params));
  }
}
```

### CanvasExportService API

**Purpose**: Export/import canvas data in multiple formats.

**Public Methods**:

```typescript
export interface CanvasExportServiceAPI {
  // Export operations
  exportToPNG(stage: any, options?: ExportPNGOptions): Observable<Blob>;
  exportToJPEG(stage: any, options: ExportJPEGOptions): Observable<Blob>;
  exportToSVG(stage: any, options?: ExportSVGOptions): Observable<string>;
  exportToJSON(): Observable<string>;
  
  // Import operations
  importFromJSON(json: string): Observable<CanvasSnapshot>;
  importImage(file: File): Observable<CanvasObject>;
  
  // Download operations
  downloadPNG(filename: string, blob: Blob): void;
  downloadJPEG(filename: string, blob: Blob): void;
  downloadSVG(filename: string, svg: string): void;
  downloadJSON(filename: string, json: string): void;
}
```

**Usage Pattern**:

```typescript
@Component({
  selector: 'export-dialog',
  standalone: true
})
export class ExportDialogComponent {
  private readonly exportService = inject(CanvasExportService);
  private readonly notificationService = inject(NotificationService);
  
  @Input() stage: any; // Konva Stage instance

  exportAsPNG(): void {
    this.exportService.exportToPNG(this.stage, { scale: 2 })
      .pipe(
        catchError(error => {
          this.notificationService.error('Export failed: ' + error.error.message);
          return throwError(() => error);
        })
      )
      .subscribe(blob => {
        this.exportService.downloadPNG('canvas-export.png', blob);
        this.notificationService.success('PNG exported successfully');
      });
  }

  exportAsJSON(): void {
    this.exportService.exportToJSON()
      .subscribe(json => {
        this.exportService.downloadJSON('canvas-export.json', json);
        this.notificationService.success('JSON exported successfully');
      });
  }

  importFromFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const json = reader.result as string;
      this.exportService.importFromJSON(json)
        .subscribe({
          next: (snapshot) => {
            // Apply snapshot to canvas
            this.notificationService.success('Canvas imported successfully');
          },
          error: (error) => {
            this.notificationService.error('Import failed: ' + error.error.message);
          }
        });
    };
    reader.readAsText(file);
  }
}
```

---

## Event Flow Patterns

### Object Creation Flow

```
User Action (Drag to draw rectangle)
  │
  ▼
CanvasStageComponent.onStageMouseDown()
  │ - Capture start position
  ▼
CanvasStageComponent.onStageMouseMove()
  │ - Update preview shape
  ▼
CanvasStageComponent.onStageMouseUp()
  │ - Emit objectCreate event
  ▼
CanvasEditorComponent.onObjectCreate()
  │ - Call CanvasService.createObject()
  ▼
CanvasService.createObject()
  │ - ValidationService.validateObjectCount() ─────┐
  │                                                 │
  │ ◄─────────────────────────────────────────────┘
  │ - ValidationService.validateDimensions() ──────┐
  │                                                 │
  │ ◄─────────────────────────────────────────────┘
  │ - Generate UUID for object
  │ - Build CanvasObject with defaults
  ▼
CanvasStateService.addObject()
  │ - Update objects signal
  ▼
CanvasHistoryService.recordAction()
  │ - Add to undo stack
  ▼
Template updates automatically (Signals)
  │ - Canvas re-renders with new object
  │ - Object count updates
  │ - Selection updates
```

### Undo/Redo Flow

```
User Action (Ctrl+Z pressed)
  │
  ▼
CanvasEditorComponent.onUndo()
  │ - Call CanvasHistoryService.undo()
  ▼
CanvasHistoryService.undo()
  │ - Pop action from undo stack
  │ - Determine action type
  ▼
Switch on action.type
  │
  ├─ 'create' ──▶ CanvasStateService.deleteObject()
  │
  ├─ 'delete' ──▶ CanvasStateService.addObject()
  │
  ├─ 'update' ──▶ CanvasStateService.updateObject()
  │                (restore 'before' state)
  │
  └─ 'move' ────▶ CanvasStateService.updateObject()
                   (restore 'before' position)
  │
  ▼
CanvasStateService updates signals
  │
  ▼
Template re-renders automatically
  │ - Canvas reflects undo operation
  │ - canUndo/canRedo signals update
```

### Export Flow

```
User Action (Click "Export PNG")
  │
  ▼
ExportDialogComponent.exportAsPNG()
  │ - Get Konva Stage reference
  │ - Define export options
  ▼
CanvasExportService.exportToPNG(stage, options)
  │ - Call Konva stage.toDataURL()
  │ - Convert data URL to Blob
  ▼
CanvasExportService.downloadPNG(filename, blob)
  │ - Create object URL
  │ - Create temporary <a> element
  │ - Trigger download
  │ - Cleanup object URL
  ▼
NotificationService.success()
  │ - Show success message
```

---

## ng2-konva Library Integration

### Konva Stage Initialization

```typescript
import { KonvaModule } from 'ng2-konva';

@Component({
  selector: 'canvas-stage',
  standalone: true,
  imports: [KonvaModule, CommonModule],
  template: `
    <ko-stage 
      [config]="stageConfig"
      (mousedown)="onStageMouseDown($event)"
      (mousemove)="onStageMouseMove($event)"
      (mouseup)="onStageMouseUp($event)"
      (click)="onStageClick($event)"
      #stage>
      <ko-layer #layer>
        <!-- Rendered objects -->
      </ko-layer>
    </ko-stage>
  `
})
export class CanvasStageComponent {
  @ViewChild('stage') stageRef: any;
  @ViewChild('layer') layerRef: any;

  stageConfig = {
    width: 1200,
    height: 800
  };

  getStage(): any {
    return this.stageRef.getStage();
  }

  getLayer(): any {
    return this.layerRef.getLayer();
  }
}
```

### Konva Object Rendering

**Rectangle**:

```typescript
<ko-rect
  [config]="{
    id: object.id,
    x: object.x,
    y: object.y,
    width: object.width,
    height: object.height,
    fill: object.fill,
    stroke: object.stroke,
    strokeWidth: object.strokeWidth,
    opacity: object.opacity,
    rotation: object.rotation,
    draggable: object.draggable && !object.locked
  }"
  (dragend)="onObjectDragEnd(object, $event)"
  (transformend)="onObjectTransformEnd(object, $event)"
  (click)="onObjectClick(object, $event)">
</ko-rect>
```

**Circle**:

```typescript
<ko-circle
  [config]="{
    id: object.id,
    x: object.x,
    y: object.y,
    radius: object.radius,
    fill: object.fill,
    stroke: object.stroke,
    draggable: object.draggable
  }"
  (dragend)="onObjectDragEnd(object, $event)"
  (click)="onObjectClick(object, $event)">
</ko-circle>
```

### Konva Transformer (Selection Handles)

```typescript
<ko-transformer
  *ngIf="selectedObjects.length > 0"
  [config]="{
    nodes: getSelectedNodes(),
    enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    boundBoxFunc: boundBoxFunc
  }">
</ko-transformer>
```

**Transformer Configuration**:

```typescript
boundBoxFunc = (oldBox: any, newBox: any): any => {
  // Enforce dimension limits (BR-C-002)
  if (newBox.width < 1) newBox.width = 1;
  if (newBox.height < 1) newBox.height = 1;
  if (newBox.width > 10000) newBox.width = 10000;
  if (newBox.height > 10000) newBox.height = 10000;
  return newBox;
};

getSelectedNodes(): any[] {
  const stage = this.stageRef.getStage();
  return this.selectedObjects.map(obj => stage.findOne('#' + obj.id));
}
```

---

## Browser API Integration

### IndexedDB Integration (Local Storage)

**Service**: `CanvasStorageService`

```typescript
import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class CanvasStorageService {
  private readonly dbName = 'CanvasDB';
  private readonly storeName = 'canvases';
  private readonly dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  private initDB(): void {
    const request = indexedDB.open(this.dbName, this.dbVersion);
    
    request.onerror = () => {
      console.error('IndexedDB initialization failed');
    };
    
    request.onsuccess = () => {
      this.db = request.result;
    };
    
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(this.storeName)) {
        const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };
  }

  saveCanvas(snapshot: CanvasSnapshot): Observable<void> {
    if (!this.db) {
      return throwError(() => new Error('Database not initialized'));
    }

    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    const request = store.put(snapshot);

    return from(new Promise<void>((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    }));
  }

  loadCanvas(canvasId: string): Observable<CanvasSnapshot> {
    if (!this.db) {
      return throwError(() => new Error('Database not initialized'));
    }

    const transaction = this.db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    const request = store.get(canvasId);

    return from(new Promise<CanvasSnapshot>((resolve, reject) => {
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result);
        } else {
          reject(new Error('Canvas not found'));
        }
      };
      request.onerror = () => reject(request.error);
    }));
  }

  listCanvases(): Observable<CanvasSnapshot[]> {
    if (!this.db) {
      return throwError(() => new Error('Database not initialized'));
    }

    const transaction = this.db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    const index = store.index('updatedAt');
    const request = index.openCursor(null, 'prev'); // Sort by updatedAt DESC

    const canvases: CanvasSnapshot[] = [];

    return from(new Promise<CanvasSnapshot[]>((resolve, reject) => {
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          canvases.push(cursor.value);
          cursor.continue();
        } else {
          resolve(canvases);
        }
      };
      request.onerror = () => reject(request.error);
    }));
  }

  deleteCanvas(canvasId: string): Observable<void> {
    if (!this.db) {
      return throwError(() => new Error('Database not initialized'));
    }

    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    const request = store.delete(canvasId);

    return from(new Promise<void>((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    }));
  }
}
```

### File API Integration (Image Upload)

```typescript
@Component({
  selector: 'image-upload',
  standalone: true,
  template: `
    <input 
      type="file"
      accept="image/png,image/jpeg,image/svg+xml,image/webp"
      (change)="onFileSelected($event)"
      #fileInput>
    <button (click)="fileInput.click()">Upload Image</button>
  `
})
export class ImageUploadComponent {
  private readonly canvasService = inject(CanvasService);
  private readonly validationService = inject(ValidationService);
  private readonly notificationService = inject(NotificationService);

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // Validate file (BR-V-001)
    const validation = this.validationService.validateFileUpload(file);
    if (!validation.valid) {
      this.notificationService.error(validation.errors[0].message);
      return;
    }

    // Read and process image
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();
      img.onload = () => {
        this.createImageObject(img, file.name);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  private createImageObject(img: HTMLImageElement, filename: string): void {
    const params: CreateObjectParams = {
      type: 'image',
      x: 100,
      y: 100,
      width: img.width,
      height: img.height,
      metadata: {
        filename,
        originalWidth: img.width,
        originalHeight: img.height
      }
    };

    this.canvasService.createObject(params)
      .subscribe({
        next: (object) => {
          // Store image reference
          object.image = img;
          this.notificationService.success('Image uploaded successfully');
        },
        error: (error) => {
          this.notificationService.error('Image upload failed: ' + error.error.message);
        }
      });
  }
}
```

---

## Error Handling Patterns

### Error Response Structure

```typescript
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// Standard error codes
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  OBJECT_LIMIT_EXCEEDED = 'OBJECT_LIMIT_EXCEEDED',
  INVALID_DIMENSIONS = 'INVALID_DIMENSIONS',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  UNSUPPORTED_FILE_TYPE = 'UNSUPPORTED_FILE_TYPE',
  IMPORT_ERROR = 'IMPORT_ERROR',
  EXPORT_ERROR = 'EXPORT_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}
```

### Global Error Handler

```typescript
@Injectable({ providedIn: 'root' })
export class CanvasErrorHandler {
  private readonly notificationService = inject(NotificationService);

  handleError(error: any): Observable<never> {
    console.error('Canvas error:', error);

    let message = 'An unexpected error occurred';
    let code = ErrorCode.UNKNOWN_ERROR;

    if (error.error) {
      code = error.error.code;
      message = error.error.message;
    } else if (error.message) {
      message = error.message;
    }

    // Map error codes to user-friendly messages
    const userMessage = this.getUserMessage(code, message);
    this.notificationService.error(userMessage);

    return throwError(() => error);
  }

  private getUserMessage(code: string, defaultMessage: string): string {
    const messages: Record<string, string> = {
      [ErrorCode.OBJECT_LIMIT_EXCEEDED]: 'Canvas object limit reached (10,000). Please delete some objects.',
      [ErrorCode.INVALID_DIMENSIONS]: 'Invalid object dimensions. Size must be between 1px and 10,000px.',
      [ErrorCode.FILE_TOO_LARGE]: 'File size exceeds 10MB limit.',
      [ErrorCode.UNSUPPORTED_FILE_TYPE]: 'File type not supported. Please use PNG, JPEG, SVG, or WebP.',
      [ErrorCode.IMPORT_ERROR]: 'Failed to import canvas. File may be corrupted.',
      [ErrorCode.EXPORT_ERROR]: 'Failed to export canvas. Please try again.',
      [ErrorCode.STORAGE_ERROR]: 'Failed to save canvas. Storage may be full.'
    };

    return messages[code] || defaultMessage;
  }
}
```

### Service-Level Error Handling

```typescript
@Injectable({ providedIn: 'root' })
export class CanvasService {
  private readonly errorHandler = inject(CanvasErrorHandler);

  createObject(params: CreateObjectParams): Observable<CanvasObject> {
    // ... validation logic ...

    return of(newObject).pipe(
      tap(obj => this.stateService.addObject(obj)),
      catchError(error => this.errorHandler.handleError(error))
    );
  }

  updateObject(object: CanvasObject): Observable<CanvasObject> {
    return of(object).pipe(
      tap(obj => this.stateService.updateObject(obj)),
      catchError(error => this.errorHandler.handleError(error))
    );
  }
}
```

### Component-Level Error Handling

```typescript
@Component({
  selector: 'canvas-editor',
  standalone: true
})
export class CanvasEditorComponent {
  private readonly canvasService = inject(CanvasService);
  
  readonly error = signal<string | null>(null);

  createShape(): void {
    this.error.set(null); // Clear previous errors

    this.canvasService.createObject(params)
      .pipe(
        catchError(error => {
          this.error.set(error.error.message);
          return EMPTY; // Don't propagate error further
        })
      )
      .subscribe({
        next: (object) => {
          console.log('Shape created:', object.id);
        }
      });
  }
}
```

---

## Future: Cloud Sync Integration

### Supabase Integration (Planned)

**Service**: `CanvasCloudSyncService`

```typescript
import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Observable, from } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CanvasCloudSyncService {
  private readonly supabase: SupabaseClient;

  constructor() {
    // Configuration from APP_CONFIG
    this.supabase = createClient(
      'https://your-project.supabase.co',
      'your-anon-key'
    );
  }

  saveToCloud(snapshot: CanvasSnapshot): Observable<CanvasSnapshot> {
    return from(
      this.supabase
        .from('canvas_snapshots')
        .upsert({
          id: snapshot.id,
          name: snapshot.name,
          data: snapshot,
          version: snapshot.version,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
    ).pipe(
      map((response: any) => response.data)
    );
  }

  loadFromCloud(canvasId: string): Observable<CanvasSnapshot> {
    return from(
      this.supabase
        .from('canvas_snapshots')
        .select('*')
        .eq('id', canvasId)
        .single()
    ).pipe(
      map((response: any) => response.data.data)
    );
  }

  listCloudCanvases(): Observable<CanvasSnapshot[]> {
    return from(
      this.supabase
        .from('canvas_snapshots')
        .select('id, name, updated_at')
        .order('updated_at', { ascending: false })
    ).pipe(
      map((response: any) => response.data)
    );
  }
}
```

---

## Integration Testing

### Service Integration Tests

```typescript
describe('CanvasService Integration', () => {
  let canvasService: CanvasService;
  let stateService: CanvasStateService;
  let validationService: ValidationService;
  let historyService: CanvasHistoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CanvasService,
        CanvasStateService,
        ValidationService,
        CanvasHistoryService
      ]
    });

    canvasService = TestBed.inject(CanvasService);
    stateService = TestBed.inject(CanvasStateService);
    validationService = TestBed.inject(ValidationService);
    historyService = TestBed.inject(CanvasHistoryService);
  });

  it('should create object and update state', (done) => {
    const params: CreateObjectParams = {
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 200,
      height: 150
    };

    canvasService.createObject(params).subscribe({
      next: (object) => {
        // Verify object created
        expect(object.type).toBe('rectangle');
        
        // Verify state updated
        expect(stateService.objectCount()).toBe(1);
        expect(stateService.objects()[0].id).toBe(object.id);
        
        // Verify history recorded
        expect(historyService.canUndo()).toBe(true);
        
        done();
      },
      error: done.fail
    });
  });

  it('should enforce object count limit', (done) => {
    // Add 10,000 objects
    for (let i = 0; i < 10000; i++) {
      const mockObject = createMockObject();
      stateService.addObject(mockObject);
    }

    // Attempt to create 10,001st object
    const params: CreateObjectParams = {
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 200,
      height: 150
    };

    canvasService.createObject(params).subscribe({
      next: () => done.fail('Should have thrown error'),
      error: (error) => {
        expect(error.error.code).toBe('OBJECT_LIMIT_EXCEEDED');
        done();
      }
    });
  });
});
```

---

## Evaluation Checklist

**Integration Points Documentation**:

- [ ] All service APIs documented with TypeScript interfaces
- [ ] Event flow diagrams provided for key operations
- [ ] Error handling patterns defined and implemented
- [ ] ng2-konva integration patterns documented
- [ ] Browser API integration (IndexedDB, File API) documented
- [ ] Future cloud sync integration planned
- [ ] Integration tests cover all service interactions
- [ ] Error codes standardized and documented
- [ ] Signal-based state management patterns defined
- [ ] Validation service integration patterns documented

---

**Specification Complete**: 04-integration-points ✅  
**Next**: testing-strategy.specification.md
