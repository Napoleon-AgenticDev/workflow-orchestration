---
meta:
  id: canvas-research-angular-canvas-libraries-testing-strategy-specification
  title: Testing Strategy - Canvas Libraries for Angular
  version: 1.0.0
  status: draft
  specType: specification
  scope: product:canvas-research
  tags: []
  createdBy: Agent Alchemy Developer v2.0.0
  createdAt: 2026-02-25T00:00:00.000Z
  reviewedAt: null
title: Testing Strategy - Canvas Libraries for Angular
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
  - .agent-alchemy/specs/standards/testing-practices.specification.md
depends-on:
  - plan/non-functional-requirements.specification.md
  - plan/business-rules.specification.md
  - architecture/api-specifications.specification.md
specification: 05-testing-strategy
---

# Testing Strategy: Canvas Libraries for Angular

## Overview

**Purpose**: Define comprehensive testing approach, test types, coverage requirements, test cases, and quality assurance processes for canvas library.

**Coverage Target**: ≥80% code coverage (lines, branches, functions, statements)  
**Test Types**: Unit, Integration, E2E, Performance, Accessibility, Visual Regression  
**Tools**: Jest, Playwright, Axe-core, Lighthouse CI

---

## Testing Pyramid

```
                 ┌─────────────────┐
                 │   E2E Tests     │  ← Few (20%)
                 │   (Playwright)  │
                 └─────────────────┘
                        │
              ┌────────────────────┐
              │  Integration Tests │  ← Some (30%)
              │      (Jest)        │
              └────────────────────┘
                       │
         ┌──────────────────────────────┐
         │      Unit Tests (Jest)       │  ← Many (50%)
         │   Services, Components,      │
         │   Utils, Pipes, Directives   │
         └──────────────────────────────┘
```

**Distribution**:
- Unit Tests: ~50% (Fast, isolated, many scenarios)
- Integration Tests: ~30% (Service interactions, workflows)
- E2E Tests: ~20% (Critical user flows, smoke tests)

---

## Unit Testing Strategy

### Service Testing

**Coverage**: 100% of public methods, 80%+ overall

**Test Categories**:
1. **Happy Path**: Valid inputs, expected behavior
2. **Error Cases**: Invalid inputs, validation failures
3. **Edge Cases**: Boundary values, empty states
4. **State Management**: Signal updates, computed values

**Example**: CanvasStateService

```typescript
describe('CanvasStateService', () => {
  let service: CanvasStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CanvasStateService);
  });

  afterEach(() => {
    service.reset();
  });

  describe('object management', () => {
    describe('addObject', () => {
      it('should add object to state', () => {
        const obj = createMockCanvasObject();
        
        service.addObject(obj);
        
        expect(service.objectCount()).toBe(1);
        expect(service.objects()[0].id).toBe(obj.id);
      });

      it('should update computed signals', () => {
        expect(service.objectCount()).toBe(0);
        
        service.addObject(createMockCanvasObject());
        
        expect(service.objectCount()).toBe(1);
      });
    });

    describe('updateObject', () => {
      it('should update existing object', () => {
        const obj = createMockCanvasObject({ id: 'test-1', x: 100 });
        service.addObject(obj);
        
        const updated = { ...obj, x: 200 };
        service.updateObject(updated);
        
        expect(service.objects()[0].x).toBe(200);
      });

      it('should not add new object if not found', () => {
        const obj = createMockCanvasObject({ id: 'non-existent' });
        
        service.updateObject(obj);
        
        expect(service.objectCount()).toBe(0);
      });
    });

    describe('deleteObject', () => {
      it('should remove object from state', () => {
        const obj = createMockCanvasObject();
        service.addObject(obj);
        
        service.deleteObject(obj.id);
        
        expect(service.objectCount()).toBe(0);
      });

      it('should remove from selection if selected', () => {
        const obj = createMockCanvasObject();
        service.addObject(obj);
        service.selectObject(obj.id);
        expect(service.hasSelection()).toBe(true);
        
        service.deleteObject(obj.id);
        
        expect(service.hasSelection()).toBe(false);
      });
    });
  });

  describe('selection management', () => {
    it('should select single object', () => {
      service.selectObject('test-1');
      
      expect(service.hasSelection()).toBe(true);
      expect(service.selectedObjects()).toHaveLength(1);
    });

    it('should add to selection with flag', () => {
      service.selectObject('test-1');
      service.selectObject('test-2', true);
      
      expect(service.selectedObjects()).toHaveLength(2);
    });

    it('should replace selection without flag', () => {
      service.selectObject('test-1');
      service.selectObject('test-2', false);
      
      expect(service.selectedObjects()).toHaveLength(1);
    });

    it('should toggle selection when adding already selected', () => {
      service.selectObject('test-1');
      service.selectObject('test-1', true);
      
      expect(service.hasSelection()).toBe(false);
    });

    it('should clear all selections', () => {
      service.selectObject('test-1');
      service.selectObject('test-2', true);
      
      service.clearSelection();
      
      expect(service.hasSelection()).toBe(false);
      expect(service.selectedObjects()).toHaveLength(0);
    });
  });

  describe('tool management', () => {
    it('should set active tool', () => {
      service.setActiveTool('rectangle');
      
      expect(service.activeTool()).toBe('rectangle');
    });

    it('should clear selection when switching to drawing tool', () => {
      service.selectObject('test-1');
      
      service.setActiveTool('rectangle');
      
      expect(service.hasSelection()).toBe(false);
    });

    it('should not clear selection when switching to select tool', () => {
      service.selectObject('test-1');
      service.setActiveTool('rectangle');
      service.selectObject('test-1');
      
      service.setActiveTool('select');
      
      expect(service.hasSelection()).toBe(true);
    });
  });

  describe('computed signals', () => {
    it('should compute selectedObjects from selection IDs', () => {
      const obj1 = createMockCanvasObject({ id: 'test-1' });
      const obj2 = createMockCanvasObject({ id: 'test-2' });
      service.addObject(obj1);
      service.addObject(obj2);
      
      service.selectObject('test-1');
      
      const selected = service.selectedObjects();
      expect(selected).toHaveLength(1);
      expect(selected[0].id).toBe('test-1');
    });

    it('should compute singleSelection when one object selected', () => {
      const obj = createMockCanvasObject({ id: 'test-1' });
      service.addObject(obj);
      service.selectObject('test-1');
      
      expect(service.singleSelection()).not.toBeNull();
      expect(service.singleSelection()?.id).toBe('test-1');
    });

    it('should return null for singleSelection when multiple selected', () => {
      service.selectObject('test-1');
      service.selectObject('test-2', true);
      
      expect(service.singleSelection()).toBeNull();
    });
  });
});

// Test helper
function createMockCanvasObject(overrides: Partial<CanvasObject> = {}): CanvasObject {
  return {
    id: 'test-' + Math.random(),
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

### Validation Service Testing

**Focus**: Business rule enforcement (BR-C-*, BR-V-*, BR-M-*)

```typescript
describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ValidationService);
  });

  describe('validateObjectCount (BR-C-001)', () => {
    it('should pass validation under limit', () => {
      const result = service.validateObjectCount(5000);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation at limit', () => {
      const result = service.validateObjectCount(10000);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('OBJECT_LIMIT_EXCEEDED');
    });

    it('should warn at warning threshold', () => {
      const result = service.validateObjectCount(5000);
      
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('OBJECT_COUNT_WARNING');
    });

    it('should critical warn at critical threshold', () => {
      const result = service.validateObjectCount(8000);
      
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('OBJECT_COUNT_CRITICAL');
    });
  });

  describe('validateDimensions (BR-C-002)', () => {
    it('should pass valid dimensions', () => {
      const result = service.validateDimensions(200, 150);
      
      expect(result.valid).toBe(true);
    });

    it('should fail too small dimensions', () => {
      const result = service.validateDimensions(0, 150);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('DIMENSION_TOO_SMALL');
    });

    it('should fail too large dimensions', () => {
      const result = service.validateDimensions(20000, 150);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('DIMENSION_TOO_LARGE');
    });

    it('should fail negative dimensions', () => {
      const result = service.validateDimensions(-100, 150);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('DIMENSION_NEGATIVE');
    });
  });

  describe('validateFileUpload (BR-V-001)', () => {
    it('should pass valid PNG file', () => {
      const file = new File([''], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 }); // 5MB
      
      const result = service.validateFileUpload(file);
      
      expect(result.valid).toBe(true);
    });

    it('should fail file too large', () => {
      const file = new File([''], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 15 * 1024 * 1024 }); // 15MB
      
      const result = service.validateFileUpload(file);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('FILE_TOO_LARGE');
    });

    it('should fail unsupported file type', () => {
      const file = new File([''], 'test.gif', { type: 'image/gif' });
      Object.defineProperty(file, 'size', { value: 1 * 1024 * 1024 });
      
      const result = service.validateFileUpload(file);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('UNSUPPORTED_FILE_TYPE');
    });
  });

  describe('validateColor', () => {
    it('should validate hex colors', () => {
      expect(service.validateColor('#FF0000')).toBe(true);
      expect(service.validateColor('#00FF00')).toBe(true);
      expect(service.validateColor('#0000FF')).toBe(true);
    });

    it('should reject invalid hex colors', () => {
      expect(service.validateColor('#GG0000')).toBe(false);
      expect(service.validateColor('FF0000')).toBe(false);
      expect(service.validateColor('#FF00')).toBe(false);
    });

    it('should validate RGB colors', () => {
      expect(service.validateColor('rgb(255, 0, 0)')).toBe(true);
      expect(service.validateColor('rgba(255, 0, 0, 0.5)')).toBe(true);
    });
  });

  describe('validateOpacity', () => {
    it('should validate opacity in range 0-1', () => {
      expect(service.validateOpacity(0)).toBe(true);
      expect(service.validateOpacity(0.5)).toBe(true);
      expect(service.validateOpacity(1)).toBe(true);
    });

    it('should reject opacity outside range', () => {
      expect(service.validateOpacity(-0.1)).toBe(false);
      expect(service.validateOpacity(1.1)).toBe(false);
    });
  });
});
```

### Component Testing

**Focus**: Component behavior, template binding, event handling

```typescript
describe('CanvasToolbarComponent', () => {
  let component: CanvasToolbarComponent;
  let fixture: ComponentFixture<CanvasToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CanvasToolbarComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CanvasToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render tool buttons', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should emit toolSelect when tool button clicked', () => {
    const emitSpy = jest.spyOn(component.toolSelect, 'emit');
    
    component.selectTool('rectangle');
    
    expect(emitSpy).toHaveBeenCalledWith('rectangle');
  });

  it('should highlight active tool', () => {
    component.activeTool = 'rectangle';
    fixture.detectChanges();
    
    const activeButton = fixture.nativeElement.querySelector('[data-tool="rectangle"]');
    
    expect(activeButton.classList.contains('p-button-primary')).toBe(true);
  });

  it('should disable undo button when canUndo is false', () => {
    component.canUndo = false;
    fixture.detectChanges();
    
    const undoButton = fixture.nativeElement.querySelector('[data-action="undo"]');
    
    expect(undoButton.disabled).toBe(true);
  });

  it('should enable undo button when canUndo is true', () => {
    component.canUndo = true;
    fixture.detectChanges();
    
    const undoButton = fixture.nativeElement.querySelector('[data-action="undo"]');
    
    expect(undoButton.disabled).toBe(false);
  });

  it('should emit undo event when undo button clicked', () => {
    const emitSpy = jest.spyOn(component.undo, 'emit');
    component.canUndo = true;
    fixture.detectChanges();
    
    const undoButton = fixture.nativeElement.querySelector('[data-action="undo"]');
    undoButton.click();
    
    expect(emitSpy).toHaveBeenCalled();
  });
});
```

---

## Integration Testing Strategy

### Service Integration Tests

**Focus**: Service-to-service interactions, state consistency

```typescript
describe('Canvas Service Integration', () => {
  let canvasService: CanvasService;
  let stateService: CanvasStateService;
  let historyService: CanvasHistoryService;
  let validationService: ValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CanvasService,
        CanvasStateService,
        CanvasHistoryService,
        ValidationService
      ]
    });

    canvasService = TestBed.inject(CanvasService);
    stateService = TestBed.inject(CanvasStateService);
    historyService = TestBed.inject(CanvasHistoryService);
    validationService = TestBed.inject(ValidationService);
  });

  describe('object creation workflow', () => {
    it('should create object, update state, and record history', (done) => {
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
          expect(historyService.historySize()).toBe(1);
          
          done();
        },
        error: done.fail
      });
    });

    it('should enforce validation rules', (done) => {
      const params: CreateObjectParams = {
        type: 'rectangle',
        x: 100,
        y: 100,
        width: -10, // Invalid
        height: 150
      };

      canvasService.createObject(params).subscribe({
        next: () => done.fail('Should have failed validation'),
        error: (error) => {
          expect(error.error.code).toBe('INVALID_DIMENSIONS');
          expect(stateService.objectCount()).toBe(0);
          done();
        }
      });
    });
  });

  describe('undo/redo workflow', () => {
    it('should undo object creation', (done) => {
      const params: CreateObjectParams = {
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 150
      };

      canvasService.createObject(params).subscribe(() => {
        expect(stateService.objectCount()).toBe(1);
        
        historyService.undo().subscribe((success) => {
          expect(success).toBe(true);
          expect(stateService.objectCount()).toBe(0);
          expect(historyService.canRedo()).toBe(true);
          done();
        });
      });
    });

    it('should redo object creation', (done) => {
      const params: CreateObjectParams = {
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 150
      };

      canvasService.createObject(params).subscribe(() => {
        historyService.undo().subscribe(() => {
          expect(stateService.objectCount()).toBe(0);
          
          historyService.redo().subscribe((success) => {
            expect(success).toBe(true);
            expect(stateService.objectCount()).toBe(1);
            done();
          });
        });
      });
    });
  });

  describe('object count limit enforcement', () => {
    it('should prevent creation beyond limit', (done) => {
      // Add 10,000 mock objects
      for (let i = 0; i < 10000; i++) {
        const obj = createMockCanvasObject();
        stateService.addObject(obj);
      }

      const params: CreateObjectParams = {
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 150
      };

      canvasService.createObject(params).subscribe({
        next: () => done.fail('Should have enforced limit'),
        error: (error) => {
          expect(error.error.code).toBe('OBJECT_LIMIT_EXCEEDED');
          expect(stateService.objectCount()).toBe(10000);
          done();
        }
      });
    });
  });
});
```

---

## E2E Testing Strategy

### Critical User Flows

**Test Coverage**: All critical user journeys

**Tool**: Playwright with cross-browser testing

#### Flow 1: Create and Manipulate Rectangle

```typescript
import { test, expect } from '@playwright/test';

test.describe('Canvas Editor - Rectangle Creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/canvas/editor');
    await page.waitForSelector('canvas-editor');
  });

  test('should create rectangle via drag', async ({ page }) => {
    // Select rectangle tool
    await page.click('[data-testid="tool-rectangle"]');
    await expect(page.locator('[data-testid="tool-rectangle"]')).toHaveClass(/active/);

    // Drag to create rectangle
    const canvas = page.locator('canvas').first();
    await canvas.click({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await page.mouse.move(300, 250);
    await page.mouse.up();

    // Verify object created
    await expect(page.locator('[data-testid="object-count"]')).toHaveText('1');
    
    // Verify object visible on canvas
    const objectList = page.locator('[data-testid="object-list"]');
    await expect(objectList.locator('[data-type="rectangle"]')).toBeVisible();
  });

  test('should select and move rectangle', async ({ page }) => {
    // Create rectangle first
    await page.click('[data-testid="tool-rectangle"]');
    const canvas = page.locator('canvas').first();
    await canvas.click({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await page.mouse.move(300, 250);
    await page.mouse.up();

    // Switch to select tool
    await page.click('[data-testid="tool-select"]');

    // Click on rectangle to select
    await canvas.click({ position: { x: 200, y: 175 } });
    
    // Verify selection
    await expect(page.locator('[data-testid="selected-count"]')).toHaveText('1');

    // Drag rectangle to new position
    await page.mouse.move(200, 175);
    await page.mouse.down();
    await page.mouse.move(400, 375);
    await page.mouse.up();

    // Verify position changed (check properties panel)
    const xInput = page.locator('[data-property="x"]');
    await expect(xInput).toHaveValue(/40[0-9]/);
  });

  test('should resize rectangle', async ({ page }) => {
    // Create and select rectangle
    await page.click('[data-testid="tool-rectangle"]');
    const canvas = page.locator('canvas').first();
    await canvas.click({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await page.mouse.move(300, 250);
    await page.mouse.up();

    await page.click('[data-testid="tool-select"]');
    await canvas.click({ position: { x: 200, y: 175 } });

    // Grab bottom-right resize handle and drag
    await page.locator('[data-resize-handle="bottom-right"]').hover();
    await page.mouse.down();
    await page.mouse.move(400, 350);
    await page.mouse.up();

    // Verify size changed
    const widthInput = page.locator('[data-property="width"]');
    await expect(widthInput).toHaveValue(/30[0-9]/);
  });

  test('should delete rectangle', async ({ page }) => {
    // Create rectangle
    await page.click('[data-testid="tool-rectangle"]');
    const canvas = page.locator('canvas').first();
    await canvas.click({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await page.mouse.move(300, 250);
    await page.mouse.up();

    // Select and delete
    await page.click('[data-testid="tool-select"]');
    await canvas.click({ position: { x: 200, y: 175 } });
    await page.keyboard.press('Delete');

    // Verify deleted
    await expect(page.locator('[data-testid="object-count"]')).toHaveText('0');
  });
});
```

#### Flow 2: Undo/Redo Operations

```typescript
test.describe('Canvas Editor - Undo/Redo', () => {
  test('should undo rectangle creation', async ({ page }) => {
    await page.goto('/canvas/editor');
    
    // Create rectangle
    await page.click('[data-testid="tool-rectangle"]');
    const canvas = page.locator('canvas').first();
    await canvas.click({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await page.mouse.move(300, 250);
    await page.mouse.up();

    await expect(page.locator('[data-testid="object-count"]')).toHaveText('1');

    // Undo
    await page.keyboard.press('Control+Z');

    // Verify undone
    await expect(page.locator('[data-testid="object-count"]')).toHaveText('0');
    
    // Verify undo button disabled
    await expect(page.locator('[data-action="undo"]')).toBeDisabled();
    
    // Verify redo button enabled
    await expect(page.locator('[data-action="redo"]')).toBeEnabled();
  });

  test('should redo rectangle creation', async ({ page }) => {
    await page.goto('/canvas/editor');
    
    // Create and undo
    await page.click('[data-testid="tool-rectangle"]');
    const canvas = page.locator('canvas').first();
    await canvas.click({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await page.mouse.move(300, 250);
    await page.mouse.up();
    await page.keyboard.press('Control+Z');

    // Redo
    await page.keyboard.press('Control+Y');

    // Verify redone
    await expect(page.locator('[data-testid="object-count"]')).toHaveText('1');
  });

  test('should clear redo stack after new action', async ({ page }) => {
    await page.goto('/canvas/editor');
    
    // Create, undo
    await page.click('[data-testid="tool-rectangle"]');
    const canvas = page.locator('canvas').first();
    await canvas.click({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await page.mouse.move(300, 250);
    await page.mouse.up();
    await page.keyboard.press('Control+Z');

    // Create new object
    await canvas.click({ position: { x: 400, y: 400 } });
    await page.mouse.down();
    await page.mouse.move(600, 550);
    await page.mouse.up();

    // Verify redo disabled (stack cleared)
    await expect(page.locator('[data-action="redo"]')).toBeDisabled();
  });
});
```

#### Flow 3: Export Functionality

```typescript
test.describe('Canvas Editor - Export', () => {
  test('should export canvas as PNG', async ({ page }) => {
    await page.goto('/canvas/editor');
    
    // Create rectangle
    await page.click('[data-testid="tool-rectangle"]');
    const canvas = page.locator('canvas').first();
    await canvas.click({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await page.mouse.move(300, 250);
    await page.mouse.up();

    // Start download
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-action="export"]');
    await page.click('[data-format="png"]');
    
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/\.png$/);
  });

  test('should export canvas as JSON', async ({ page }) => {
    await page.goto('/canvas/editor');
    
    // Create rectangle
    await page.click('[data-testid="tool-rectangle"]');
    const canvas = page.locator('canvas').first();
    await canvas.click({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await page.mouse.move(300, 250);
    await page.mouse.up();

    // Export JSON
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-action="export"]');
    await page.click('[data-format="json"]');
    
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/\.json$/);
    
    // Verify JSON content
    const content = await download.path();
    const jsonContent = JSON.parse(await fs.readFile(content, 'utf-8'));
    expect(jsonContent.objects).toHaveLength(1);
    expect(jsonContent.objects[0].type).toBe('rectangle');
  });
});
```

---

## Performance Testing

### Performance Test Cases

```typescript
describe('Canvas Performance', () => {
  test('should maintain 60fps with 1,000 objects', async ({ page }) => {
    await page.goto('/canvas/editor');
    
    // Enable FPS counter
    await page.evaluate(() => {
      (window as any).enableFPSCounter = true;
    });

    // Create 1,000 objects
    await page.click('[data-testid="tool-circle"]');
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * 1100 + 50;
      const y = Math.random() * 700 + 50;
      const canvas = page.locator('canvas').first();
      await canvas.click({ position: { x, y } });
    }

    // Wait for rendering to stabilize
    await page.waitForTimeout(2000);

    // Check FPS
    const fps = await page.evaluate(() => {
      return (window as any).currentFPS;
    });

    expect(fps).toBeGreaterThanOrEqual(60);
  });

  test('should load canvas with 5,000 objects in <2 seconds', async ({ page }) => {
    // Pre-populate canvas with 5,000 objects
    const largeCanvas = generateCanvasWithObjects(5000);
    await page.goto('/canvas/editor');
    
    // Start timer
    const startTime = Date.now();
    
    // Load canvas
    await page.evaluate((canvasData) => {
      (window as any).loadCanvasData(canvasData);
    }, largeCanvas);

    // Wait for load complete
    await page.waitForSelector('[data-load-status="complete"]');
    
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(2000);
  });

  test('should maintain responsive UI during export', async ({ page }) => {
    await page.goto('/canvas/editor');
    
    // Create many objects
    await page.click('[data-testid="tool-rectangle"]');
    for (let i = 0; i < 100; i++) {
      const canvas = page.locator('canvas').first();
      await canvas.click({ position: { x: i * 10, y: i * 5 } });
      await page.mouse.down();
      await page.mouse.move(i * 10 + 50, i * 5 + 50);
      await page.mouse.up();
    }

    // Start export
    await page.click('[data-action="export"]');
    await page.click('[data-format="png"]');

    // Verify UI remains responsive
    const isResponsive = await page.evaluate(() => {
      return (window as any).isUIResponsive();
    });

    expect(isResponsive).toBe(true);
  });
});
```

---

## Accessibility Testing

### Axe-core Integration

```typescript
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Canvas Editor - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/canvas/editor');
    await injectAxe(page);
  });

  test('should pass WCAG 2.1 AA compliance', async ({ page }) => {
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: {
        html: true
      }
    });
  });

  test('should have keyboard navigation', async ({ page }) => {
    // Tab through toolbar buttons
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="tool-select"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="tool-rectangle"]')).toBeFocused();
    
    // Select tool with Enter
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="tool-rectangle"]')).toHaveClass(/active/);
  });

  test('should have ARIA labels', async ({ page }) => {
    const toolbar = page.locator('[role="toolbar"]');
    await expect(toolbar).toHaveAttribute('aria-label', 'Canvas tools');
    
    const selectButton = page.locator('[data-testid="tool-select"]');
    await expect(selectButton).toHaveAttribute('aria-label', /Select tool/);
  });

  test('should announce state changes to screen readers', async ({ page }) => {
    // Create object
    await page.click('[data-testid="tool-rectangle"]');
    const canvas = page.locator('canvas').first();
    await canvas.click({ position: { x: 100, y: 100 } });
    await page.mouse.down();
    await page.mouse.move(300, 250);
    await page.mouse.up();

    // Verify live region updated
    const liveRegion = page.locator('[role="status"]');
    await expect(liveRegion).toHaveText(/Rectangle created/);
  });
});
```

---

## Test Coverage Requirements

### Coverage Thresholds

**Jest Configuration**:

```typescript
// jest.config.ts
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  },
  './libs/canvas-feature/src/lib/services/**/*.ts': {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90
  }
}
```

### Coverage Exclusions

```typescript
collectCoverageFrom: [
  'src/**/*.ts',
  '!src/**/*.spec.ts',
  '!src/**/*.stories.ts',
  '!src/**/index.ts',
  '!src/test-setup.ts',
  '!src/**/*.model.ts'  // Models are just interfaces
]
```

---

## CI/CD Test Integration

### GitHub Actions Workflow

```yaml
name: Canvas Feature Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20.18.0'
          cache: 'yarn'
      
      - run: yarn install --frozen-lockfile
      - run: nx test canvas-feature --code-coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/libs/canvas-feature/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20.18.0'
          cache: 'yarn'
      
      - run: yarn install --frozen-lockfile
      - run: npx playwright install --with-deps
      - run: nx e2e canvas-feature-e2e

  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: yarn install --frozen-lockfile
      - run: npx lhci autorun
```

---

## Test Quality Checklist

**Unit Tests**:
- [ ] All services have 90%+ coverage
- [ ] All components have 80%+ coverage
- [ ] Business rules validated (BR-*)
- [ ] Error cases tested
- [ ] Edge cases tested
- [ ] Signal updates tested
- [ ] Test helpers provided

**Integration Tests**:
- [ ] Service interactions tested
- [ ] State consistency verified
- [ ] Undo/redo workflows tested
- [ ] Validation enforcement tested

**E2E Tests**:
- [ ] All critical user flows tested
- [ ] Cross-browser compatibility verified
- [ ] Mobile scenarios tested
- [ ] Export/import tested

**Performance Tests**:
- [ ] 60fps with 1K objects
- [ ] 30fps with 10K objects
- [ ] Load time < 2 seconds
- [ ] Export time < 5 seconds

**Accessibility Tests**:
- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation tested
- [ ] Screen reader compatibility
- [ ] Focus management verified

---

**Specification Complete**: 05-testing-strategy ✅  
**Next**: documentation-requirements.specification.md
