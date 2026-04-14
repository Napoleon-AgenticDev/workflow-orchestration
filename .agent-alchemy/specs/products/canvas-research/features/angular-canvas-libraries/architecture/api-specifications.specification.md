---
meta:
  id: canvas-research-angular-canvas-libraries-api-specifications-specification
  title: API Specifications - Canvas Libraries for Angular
  version: 1.0.0
  status: draft
  specType: specification
  scope: product:canvas-research
  tags: []
  createdBy: Agent Alchemy Architecture
  createdAt: 2026-02-25T00:00:00.000Z
  reviewedAt: null
title: API Specifications - Canvas Libraries for Angular
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
  - .agent-alchemy/specs/stack/stack.json
depends-on:
  - architecture/system-architecture.specification.md
  - architecture/database-schema.specification.md
specification: 04-api-specifications
---

# API Specifications: Canvas Libraries for Angular

## Overview

**Purpose**: Define API contracts for canvas feature (client-side only with future cloud sync).

**API Type**: Client-side TypeScript APIs  
**Future Enhancement**: REST API for cloud sync (Supabase)  
**No Backend Required**: MVP is entirely client-side

## Client-Side API Architecture

### Service API Contracts

All canvas operations exposed through Angular services with typed interfaces.

#### CanvasService API

**Purpose**: Core canvas operations

```typescript
import { Injectable, Signal } from '@angular/core';
import { Observable } from 'rxjs';

export interface CanvasServiceAPI {
  // Object Management
  createObject(params: CreateObjectParams): Observable<CanvasObject>;
  updateObject(object: CanvasObject): Observable<CanvasObject>;
  deleteObject(objectId: string): Observable<void>;
  deleteSelected(): Observable<void>;
  duplicateObject(objectId: string): Observable<CanvasObject>;
  
  // Selection Management
  selectObject(objectId: string, addToSelection?: boolean): void;
  selectMultiple(objectIds: string[]): void;
  clearSelection(): void;
  selectAll(): void;
  
  // Transformation
  moveObject(objectId: string, delta: { x: number; y: number }): void;
  resizeObject(objectId: string, size: { width: number; height: number }): void;
  rotateObject(objectId: string, angle: number): void;
  
  // Layer Management
  createLayer(name: string): Observable<Layer>;
  deleteLayer(layerId: string): Observable<void>;
  moveToLayer(objectId: string, layerId: string): void;
  reorderLayers(layerIds: string[]): void;
  
  // Canvas State
  clearCanvas(): void;
  resetCanvas(): void;
  
  // Tool Management
  setActiveTool(tool: Tool): void;
  getActiveTool(): Signal<Tool>;
}

export interface CreateObjectParams {
  type: 'rectangle' | 'circle' | 'line' | 'polygon' | 'text' | 'image' | 'path';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: number[];
  text?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}

@Injectable({ providedIn: 'root' })
export class CanvasService implements CanvasServiceAPI {
  // Implementation
}
```

#### CanvasHistoryService API

**Purpose**: Undo/redo operations

```typescript
export interface CanvasHistoryServiceAPI {
  // History Operations
  undo(): Observable<boolean>;
  redo(): Observable<boolean>;
  
  // History State (Signals)
  canUndo: Signal<boolean>;
  canRedo: Signal<boolean>;
  historySize: Signal<number>;
  
  // History Management
  recordAction(action: HistoryAction, state: CanvasSnapshot): void;
  clearHistory(): void;
  setMaxHistorySize(size: number): void;
}

export interface HistoryAction {
  type: 'create' | 'update' | 'delete' | 'move' | 'resize' | 'rotate';
  objectId: string;
  before?: Partial<CanvasObject>;
  after?: Partial<CanvasObject>;
}
```

#### CanvasExportService API

**Purpose**: Export/import operations

```typescript
export interface CanvasExportServiceAPI {
  // Export Operations
  exportToPNG(options?: ExportPNGOptions): Observable<Blob>;
  exportToJPEG(options?: ExportJPEGOptions): Observable<Blob>;
  exportToSVG(options?: ExportSVGOptions): Observable<string>;
  exportToJSON(): Observable<string>;
  
  // Import Operations
  importFromJSON(json: string): Observable<CanvasSnapshot>;
  importImage(file: File): Observable<CanvasObject>;
  
  // Download Helpers
  downloadPNG(filename?: string): Observable<void>;
  downloadJPEG(filename?: string): Observable<void>;
  downloadSVG(filename?: string): Observable<void>;
  downloadJSON(filename?: string): Observable<void>;
}

export interface ExportPNGOptions {
  width?: number;
  height?: number;
  scale?: number;      // 1.0 = 100%, 2.0 = 200% (for high DPI)
  quality?: number;    // 0-1
}

export interface ExportJPEGOptions extends ExportPNGOptions {
  quality: number;     // 0-1 (required for JPEG)
}

export interface ExportSVGOptions {
  includeImages?: boolean;
  embedFonts?: boolean;
}
```

#### ValidationService API

**Purpose**: Business rule validation

```typescript
export interface ValidationServiceAPI {
  // Object Validation
  validateObjectCreation(params: CreateObjectParams): ValidationResult;
  validateObjectUpdate(object: CanvasObject): ValidationResult;
  validateDimensions(width: number, height: number): ValidationResult;
  validateFileUpload(file: File): ValidationResult;
  
  // Canvas Validation
  validateObjectCount(currentCount: number): ValidationResult;
  validateCanvasSize(width: number, height: number): ValidationResult;
  validateMemoryUsage(): Observable<ValidationResult>;
  
  // Property Validation
  validateColor(color: string): boolean;
  validateOpacity(opacity: number): boolean;
  validateStrokeWidth(width: number): boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  threshold?: number;
}
```

## Data Transfer Objects (DTOs)

### Canvas Object DTO

```typescript
export interface CanvasObjectDTO {
  id: string;
  type: 'rectangle' | 'circle' | 'line' | 'polygon' | 'text' | 'image' | 'path';
  layerId: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: number[];
  text?: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  locked: boolean;
  visible: boolean;
  zIndex: number;
  metadata: Record<string, any>;
}
```

### Canvas Snapshot DTO

```typescript
export interface CanvasSnapshotDTO {
  id: string;
  name: string;
  objects: CanvasObjectDTO[];
  layers: LayerDTO[];
  metadata: CanvasMetadataDTO;
  version: string;
  createdAt: string;      // ISO 8601
  updatedAt: string;      // ISO 8601
  autoSaved: boolean;
}

export interface LayerDTO {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  zIndex: number;
}

export interface CanvasMetadataDTO {
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  gridEnabled: boolean;
  gridSize: number;
  snapToGrid: boolean;
  zoom: number;
}
```

## Future Cloud API (Planned)

### Supabase REST API Endpoints

**Base URL**: `https://[project].supabase.co/rest/v1/`

#### Canvas Operations

```
POST   /canvas_snapshots              # Create canvas
GET    /canvas_snapshots?user_id=eq.{id}  # List user canvases
GET    /canvas_snapshots?id=eq.{id}   # Get canvas by ID
PATCH  /canvas_snapshots?id=eq.{id}   # Update canvas
DELETE /canvas_snapshots?id=eq.{id}   # Delete canvas
```

**Request/Response Examples**:

```typescript
// POST /canvas_snapshots
// Request Body:
{
  "name": "My Diagram",
  "data": { /* CanvasSnapshotDTO */ },
  "version": "1.0.0"
}

// Response: 201 Created
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "My Diagram",
  "data": { /* CanvasSnapshotDTO */ },
  "version": "1.0.0",
  "created_at": "2026-02-25T10:00:00Z",
  "updated_at": "2026-02-25T10:00:00Z"
}
```

#### Image Upload (Future)

```
POST /storage/v1/object/canvas-images  # Upload image
GET  /storage/v1/object/canvas-images/{path}  # Get image URL
```

## Error Handling

### Error Response Format

```typescript
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// Example error codes:
// - VALIDATION_ERROR
// - OBJECT_LIMIT_EXCEEDED
// - INVALID_DIMENSIONS
// - FILE_TOO_LARGE
// - UNSUPPORTED_FILE_TYPE
// - STORAGE_QUOTA_EXCEEDED
```

### Error Handling Pattern

```typescript
this.canvasService.createObject(params)
  .pipe(
    catchError((error: ErrorResponse) => {
      switch (error.error.code) {
        case 'OBJECT_LIMIT_EXCEEDED':
          this.notificationService.showError('Maximum object limit reached (10,000)');
          break;
        case 'INVALID_DIMENSIONS':
          this.notificationService.showError('Invalid object dimensions');
          break;
        default:
          this.notificationService.showError('Failed to create object');
      }
      return throwError(() => error);
    })
  )
  .subscribe();
```

## API Versioning Strategy

### Client-Side API Versioning

- **No formal versioning**: Client-side APIs evolve with application
- **Breaking changes**: Major version bump of npm package
- **Backward compatibility**: Maintain for at least 1 major version

### Data Format Versioning

```typescript
// Canvas JSON export includes version
{
  "version": "1.0.0",
  "data": { /* canvas data */ }
}

// Migration on import
function importCanvas(json: string): CanvasSnapshot {
  const data = JSON.parse(json);
  if (data.version === '1.0.0') {
    return migrateV1toV2(data);
  }
  return data;
}
```

## Rate Limiting (Future Cloud API)

### Client-Side Rate Limiting

- No rate limits for client-side operations
- Future cloud sync: 100 requests/minute per user
- Debounced auto-save: Maximum 1 save/60 seconds

## Security Considerations

### Client-Side API Security

1. **Input Sanitization**
   - All user inputs validated before processing
   - File uploads type-checked and size-limited

2. **XSS Prevention**
   - Angular's built-in sanitization for text rendering
   - No innerHTML with user content

3. **Data Integrity**
   - JSON schema validation on import
   - Checksum validation for exports (optional)

## Testing API Contracts

### Service Testing Pattern

```typescript
describe('CanvasService', () => {
  let service: CanvasService;
  let stateService: CanvasStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CanvasService, CanvasStateService]
    });
    service = TestBed.inject(CanvasService);
    stateService = TestBed.inject(CanvasStateService);
  });

  describe('createObject', () => {
    it('should create rectangle with valid dimensions', (done) => {
      const params: CreateObjectParams = {
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        fill: '#FF0000'
      };

      service.createObject(params).subscribe({
        next: (object) => {
          expect(object.type).toBe('rectangle');
          expect(object.width).toBe(200);
          expect(object.height).toBe(150);
          done();
        },
        error: done.fail
      });
    });

    it('should reject invalid dimensions', (done) => {
      const params: CreateObjectParams = {
        type: 'rectangle',
        x: 100,
        y: 100,
        width: -10,  // Invalid
        height: 150
      };

      service.createObject(params).subscribe({
        next: () => done.fail('Should have rejected invalid dimensions'),
        error: (error) => {
          expect(error.error.code).toBe('INVALID_DIMENSIONS');
          done();
        }
      });
    });
  });
});
```

## API Documentation

### Generated Documentation

- Use Compodoc for TypeScript API documentation
- Include JSDoc comments on all public methods
- Provide usage examples in README

```typescript
/**
 * Creates a new canvas object with the specified parameters.
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
 *   .subscribe(object => console.log('Created:', object));
 * ```
 */
createObject(params: CreateObjectParams): Observable<CanvasObject>;
```

## Evaluation Criteria

- [x] All service APIs defined with TypeScript interfaces
- [x] DTOs specified for all data transfers
- [x] Error response format standardized
- [x] Validation API contracts complete
- [x] Export/import API comprehensive
- [x] Future cloud API considered
- [x] API versioning strategy documented
- [x] Security considerations addressed
- [x] Testing patterns provided
- [x] No backend API required for MVP

---

**Specification**: 04-api-specifications ✅  
**Next**: security-architecture.specification.md
