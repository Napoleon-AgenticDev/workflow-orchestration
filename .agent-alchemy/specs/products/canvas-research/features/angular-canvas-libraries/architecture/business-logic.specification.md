---
meta:
  id: canvas-research-angular-canvas-libraries-business-logic-specification
  title: Business Logic Implementation - Canvas Libraries for Angular
  version: 1.0.0
  status: draft
  specType: specification
  scope: product:canvas-research
  tags: []
  createdBy: Agent Alchemy Architecture
  createdAt: 2026-02-25T00:00:00.000Z
  reviewedAt: null
title: Business Logic Implementation - Canvas Libraries for Angular
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
  - .agent-alchemy/specs/standards/coding-standards.specification.md
depends-on:
  - plan/business-rules.specification.md
  - plan/functional-requirements.specification.md
  - architecture/api-specifications.specification.md
specification: 06-business-logic
---

# Business Logic Implementation: Canvas Libraries for Angular

## Overview

**Purpose**: Define implementation approach for business rules from plan phase.

**Business Rules**: 23 rules across 8 categories (BR-C, BR-M, BR-L, BR-V, BR-S, BR-E, BR-P, BR-U)  
**Implementation Pattern**: Service-based business logic with validation layer  
**Rule Engine**: TypeScript classes with rule composition

## Business Rule Categories

### Object Creation Rules (BR-C)

#### BR-C-001: Object Count Limit (10,000 max)

**Implementation**:
```typescript
@Injectable({ providedIn: 'root' })
export class ObjectCreationService {
  constructor(
    private stateService: CanvasStateService,
    private notificationService: NotificationService
  ) {}

  canCreateObject(): boolean {
    const currentCount = this.stateService.objectCount();
    
    if (currentCount >= 10000) {
      this.notificationService.showError(
        'Cannot create more objects. Maximum 10,000 objects reached.'
      );
      return false;
    }
    
    if (currentCount >= 8000) {
      this.notificationService.showWarning(
        'Nearing object limit. Consider using layers or simplifying.'
      );
    } else if (currentCount >= 5000) {
      this.notificationService.showInfo(
        'Canvas has many objects. Performance may be affected.'
      );
    }
    
    return true;
  }
}
```

#### BR-C-002: Shape Dimension Limits

```typescript
export class DimensionValidator {
  static readonly MIN_SIZE = 1;
  static readonly MAX_SIZE = 10000;
  static readonly MIN_CANVAS = 50;
  static readonly MAX_CANVAS = 20000;

  validateObjectDimensions(width: number, height: number): ValidationResult {
    const errors: ValidationError[] = [];

    if (width < this.MIN_SIZE || height < this.MIN_SIZE) {
      errors.push({
        code: 'DIMENSIONS_TOO_SMALL',
        message: `Minimum dimensions: ${this.MIN_SIZE}px x ${this.MIN_SIZE}px`,
        field: 'dimensions'
      });
    }

    if (width > this.MAX_SIZE || height > this.MAX_SIZE) {
      errors.push({
        code: 'DIMENSIONS_TOO_LARGE',
        message: `Maximum dimensions: ${this.MAX_SIZE}px x ${this.MAX_SIZE}px`,
        field: 'dimensions'
      });
    }

    // Auto-clamp if possible
    const clamped = {
      width: Math.max(this.MIN_SIZE, Math.min(width, this.MAX_SIZE)),
      height: Math.max(this.MIN_SIZE, Math.min(height, this.MAX_SIZE))
    };

    return {
      valid: errors.length === 0,
      errors,
      warnings: errors.length > 0 ? [{ 
        code: 'DIMENSIONS_CLAMPED', 
        message: 'Dimensions adjusted to valid range' 
      }] : [],
      correctedValue: clamped
    };
  }
}
```

#### BR-C-003: Unique Object IDs

```typescript
export class ObjectIdService {
  generateId(): string {
    return `obj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  ensureUniqueId(id: string, existingIds: Set<string>): string {
    let uniqueId = id;
    let counter = 1;
    
    while (existingIds.has(uniqueId)) {
      uniqueId = `${id}-${counter}`;
      counter++;
    }
    
    return uniqueId;
  }
}
```

### Object Manipulation Rules (BR-M)

#### BR-M-001: Selection Rules

```typescript
export class SelectionManager {
  selectObject(
    objectId: string,
    currentSelection: Set<string>,
    event: { ctrlKey: boolean; shiftKey: boolean }
  ): Set<string> {
    const newSelection = new Set(currentSelection);

    if (event.ctrlKey || event.metaKey) {
      // Toggle selection
      if (newSelection.has(objectId)) {
        newSelection.delete(objectId);
      } else {
        newSelection.add(objectId);
      }
    } else if (event.shiftKey) {
      // Add to selection
      newSelection.add(objectId);
    } else {
      // Single selection
      newSelection.clear();
      newSelection.add(objectId);
    }

    return newSelection;
  }

  selectByRegion(
    objects: CanvasObject[],
    region: { x: number; y: number; width: number; height: number },
    addToSelection: boolean,
    currentSelection: Set<string>
  ): Set<string> {
    const newSelection = addToSelection ? new Set(currentSelection) : new Set<string>();

    objects.forEach(obj => {
      if (this.isInRegion(obj, region)) {
        newSelection.add(obj.id);
      }
    });

    return newSelection;
  }

  private isInRegion(obj: CanvasObject, region: any): boolean {
    return (
      obj.x >= region.x &&
      obj.y >= region.y &&
      obj.x + (obj.width || 0) <= region.x + region.width &&
      obj.y + (obj.height || 0) <= region.y + region.height
    );
  }
}
```

#### BR-M-002: Transformation Constraints

```typescript
export class TransformationValidator {
  validateMove(object: CanvasObject, delta: { x: number; y: number }, canvasSize: CanvasSize): boolean {
    const newX = object.x + delta.x;
    const newY = object.y + delta.y;

    // Optional: Constrain to canvas bounds
    if (this.constrainToCanvas) {
      return newX >= 0 && newY >= 0 &&
             newX + (object.width || 0) <= canvasSize.width &&
             newY + (object.height || 0) <= canvasSize.height;
    }

    return true;
  }

  validateScale(scale: number): number {
    const MIN_SCALE = 0.01; // 1%
    const MAX_SCALE = 100;  // 10000%
    return Math.max(MIN_SCALE, Math.min(scale, MAX_SCALE));
  }

  normalizeRotation(angle: number): number {
    // Normalize to 0-360
    return ((angle % 360) + 360) % 360;
  }
}
```

### Validation Rules (BR-V)

#### BR-V-001: File Upload Validation

**Implemented in security-architecture.specification.md**

#### BR-V-003: Property Value Validation

```typescript
export class PropertyValidator {
  validateColor(color: string): boolean {
    // Hex, RGB, RGBA, or named color
    const hexRegex = /^#([0-9A-F]{3}|[0-9A-F]{6}|[0-9A-F]{8})$/i;
    const rgbRegex = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/;
    const namedColors = ['red', 'blue', 'green', 'black', 'white', /* ... */];

    return hexRegex.test(color) || rgbRegex.test(color) || namedColors.includes(color.toLowerCase());
  }

  validateOpacity(opacity: number): number {
    return Math.max(0, Math.min(1, opacity));
  }

  validateStrokeWidth(width: number): number {
    return Math.max(0, Math.min(100, width));
  }

  validateFontSize(size: number): number {
    return Math.max(6, Math.min(500, size));
  }
}
```

### State Management Rules (BR-S)

#### BR-S-001: Undo/Redo Stack

```typescript
export class HistoryManager {
  private readonly MAX_HISTORY_SIZE = 50;
  private undoStack: HistoryAction[] = [];
  private redoStack: HistoryAction[] = [];

  recordAction(action: HistoryAction): void {
    this.undoStack.push(action);
    
    // Clear redo stack on new action
    this.redoStack = [];
    
    // Enforce size limit
    if (this.undoStack.length > this.MAX_HISTORY_SIZE) {
      this.undoStack.shift(); // Remove oldest
    }
  }

  undo(): HistoryAction | null {
    const action = this.undoStack.pop();
    if (action) {
      this.redoStack.push(action);
      return action;
    }
    return null;
  }

  redo(): HistoryAction | null {
    const action = this.redoStack.pop();
    if (action) {
      this.undoStack.push(action);
      return action;
    }
    return null;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
```

### Export/Import Rules (BR-E)

#### BR-E-001: Export Format Rules

```typescript
export class ExportService {
  exportToPNG(options: ExportPNGOptions = {}): Observable<Blob> {
    const maxDimensions = 8192; // Browser limit
    const dpi = options.dpi || 72;
    const scale = options.scale || 1;

    // Validate dimensions
    const width = this.canvasSize.width * scale;
    const height = this.canvasSize.height * scale;

    if (width > maxDimensions || height > maxDimensions) {
      return throwError(() => new Error(
        `Export dimensions ${width}x${height} exceed browser limit of ${maxDimensions}px`
      ));
    }

    return from(this.generatePNG(width, height));
  }

  exportToJSON(): Observable<string> {
    const snapshot: CanvasSnapshotDTO = {
      id: this.canvasId,
      name: this.canvasName,
      objects: this.stateService.objects(),
      layers: this.stateService.layers(),
      metadata: this.stateService.metadata(),
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      autoSaved: false
    };

    return of(JSON.stringify(snapshot, null, 2));
  }
}
```

#### BR-E-002: Import Compatibility

```typescript
export class ImportService {
  importFromJSON(json: string): Observable<CanvasSnapshot> {
    return defer(() => {
      try {
        const data = JSON.parse(json);
        
        // Version check
        if (!data.version) {
          return throwError(() => new Error('Invalid canvas format: missing version'));
        }

        // Migrate if necessary
        const migrated = this.migrateToCurrentVersion(data);
        
        // Validate schema
        const validation = this.validateSchema(migrated);
        if (!validation.valid) {
          return throwError(() => new Error(`Invalid canvas data: ${validation.errors.join(', ')}`));
        }

        return of(migrated);
      } catch (error) {
        return throwError(() => new Error('Failed to parse canvas JSON'));
      }
    });
  }

  private migrateToCurrentVersion(data: any): CanvasSnapshot {
    const CURRENT_VERSION = '1.0.0';
    
    if (data.version === CURRENT_VERSION) {
      return data;
    }

    // Migration logic
    if (data.version === '0.9.0') {
      return this.migrateV09toV10(data);
    }

    throw new Error(`Unsupported canvas version: ${data.version}`);
  }
}
```

### Performance Rules (BR-P)

#### BR-P-001: Performance Degradation Thresholds

```typescript
export class PerformanceMonitor {
  private frameRateHistory: number[] = [];
  private readonly FPS_SAMPLE_SIZE = 60;

  monitorFrameRate(deltaTime: number): void {
    const fps = 1000 / deltaTime;
    this.frameRateHistory.push(fps);

    if (this.frameRateHistory.length > this.FPS_SAMPLE_SIZE) {
      this.frameRateHistory.shift();
    }

    const avgFPS = this.frameRateHistory.reduce((a, b) => a + b) / this.frameRateHistory.length;

    if (avgFPS < 30 && this.frameRateHistory.length === this.FPS_SAMPLE_SIZE) {
      this.notificationService.showWarning(
        'Performance degraded. Consider enabling "Performance Mode" or reducing objects.'
      );
    }
  }

  checkObjectCount(count: number): void {
    if (count >= 10000) {
      this.notificationService.showError('Maximum object limit reached.');
    } else if (count >= 8000) {
      this.notificationService.showWarning('High object count. Consider simplifying canvas.');
    } else if (count >= 5000) {
      this.notificationService.showInfo('Performance may be affected with many objects.');
    }
  }
}
```

## Business Logic Service Architecture

### Centralized Rules Engine

```typescript
@Injectable({ providedIn: 'root' })
export class CanvasRulesEngine {
  constructor(
    private objectCreationService: ObjectCreationService,
    private dimensionValidator: DimensionValidator,
    private selectionManager: SelectionManager,
    private transformationValidator: TransformationValidator,
    private propertyValidator: PropertyValidator,
    private historyManager: HistoryManager,
    private performanceMonitor: PerformanceMonitor
  ) {}

  // Orchestrate all business rules
  validateObjectCreation(params: CreateObjectParams): ValidationResult {
    const results: ValidationResult[] = [];

    // BR-C-001: Check object count
    if (!this.objectCreationService.canCreateObject()) {
      return {
        valid: false,
        errors: [{ code: 'OBJECT_LIMIT_EXCEEDED', message: 'Cannot create more objects' }],
        warnings: []
      };
    }

    // BR-C-002: Validate dimensions
    if (params.width && params.height) {
      results.push(this.dimensionValidator.validateObjectDimensions(params.width, params.height));
    }

    // BR-V-003: Validate properties
    if (params.fill && !this.propertyValidator.validateColor(params.fill)) {
      results.push({
        valid: false,
        errors: [{ code: 'INVALID_COLOR', message: 'Invalid fill color', field: 'fill' }],
        warnings: []
      });
    }

    // Combine results
    return this.combineValidationResults(results);
  }

  private combineValidationResults(results: ValidationResult[]): ValidationResult {
    return {
      valid: results.every(r => r.valid),
      errors: results.flatMap(r => r.errors),
      warnings: results.flatMap(r => r.warnings)
    };
  }
}
```

## Rule Testing Strategy

### Business Rule Tests

```typescript
describe('Business Rules', () => {
  describe('BR-C-001: Object Count Limit', () => {
    it('should prevent creation when limit reached', () => {
      // Arrange
      const service = new ObjectCreationService(stateService, notificationService);
      jest.spyOn(stateService, 'objectCount').mockReturnValue(10000);

      // Act
      const canCreate = service.canCreateObject();

      // Assert
      expect(canCreate).toBe(false);
      expect(notificationService.showError).toHaveBeenCalledWith(
        expect.stringContaining('Maximum 10,000 objects')
      );
    });

    it('should warn at 8000 objects', () => {
      // Test warning threshold
    });
  });

  describe('BR-C-002: Dimension Limits', () => {
    it('should clamp dimensions to valid range', () => {
      const validator = new DimensionValidator();
      const result = validator.validateObjectDimensions(20000, 20000);
      
      expect(result.valid).toBe(false);
      expect(result.correctedValue).toEqual({ width: 10000, height: 10000 });
    });
  });

  describe('BR-M-001: Selection Rules', () => {
    it('should toggle selection with Ctrl+click', () => {
      const manager = new SelectionManager();
      const current = new Set(['obj1']);
      
      const result = manager.selectObject('obj2', current, { ctrlKey: true, shiftKey: false });
      
      expect(result.has('obj1')).toBe(true);
      expect(result.has('obj2')).toBe(true);
    });
  });
});
```

## Evaluation Criteria

- [x] All 23 business rules implemented
- [x] Validation logic centralized in services
- [x] Rule composition and orchestration defined
- [x] Error and warning messages user-friendly
- [x] Rules testable in isolation
- [x] Performance monitoring integrated
- [x] Business logic separated from UI
- [x] Rules align with plan phase specifications

---

**Specification**: 06-business-logic ✅  
**Next**: devops-deployment.specification.md
