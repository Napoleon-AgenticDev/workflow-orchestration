---
meta:
  id: canvas-research-angular-canvas-libraries-documentation-requirements-specification
  title: Documentation Requirements - Canvas Libraries for Angular
  version: 1.0.0
  status: draft
  specType: specification
  scope: product:canvas-research
  tags: []
  createdBy: Agent Alchemy Developer v2.0.0
  createdAt: 2026-02-25T00:00:00.000Z
  reviewedAt: null
title: Documentation Requirements - Canvas Libraries for Angular
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
  - .agent-alchemy/specs/standards/documentation-standards.specification.md
depends-on:
  - architecture/api-specifications.specification.md
  - architecture/ui-components.specification.md
  - plan/functional-requirements.specification.md
specification: 06-documentation-requirements
---

# Documentation Requirements: Canvas Libraries for Angular

## Overview

**Purpose**: Define comprehensive documentation standards, requirements, templates, and deliverables for canvas library.

**Audience**:
- **Developers**: Integrating canvas into applications
- **Contributors**: Extending canvas functionality
- **End Users**: Using canvas editor (future user guide)
- **Maintainers**: Understanding architecture and design

**Documentation Types**:
1. Code Documentation (JSDoc, inline comments)
2. API Documentation (TypeDoc generated)
3. README Files (setup, usage, examples)
4. Architecture Documentation (ADRs, diagrams)
5. User Guide (screenshots, tutorials)
6. Contributing Guide (development workflow)

---

## Code Documentation Standards

### JSDoc Requirements

**All Public APIs Must Have JSDoc**:
- Services (all public methods)
- Components (component class, major methods)
- Directives (selector, usage)
- Pipes (transform logic)
- Models (interfaces, types)
- Utilities (public functions)

### Service Documentation Template

```typescript
/**
 * Manages canvas object operations including creation, updates, and deletion.
 * Integrates with CanvasStateService for state management and ValidationService
 * for business rule enforcement.
 * 
 * @remarks
 * This service serves as the primary orchestration layer for canvas operations.
 * All object modifications should flow through this service to ensure proper
 * validation, state updates, and history recording.
 * 
 * @example
 * Basic Usage
 * ```typescript
 * constructor(private canvasService: CanvasService) {}
 * 
 * createRectangle(): void {
 *   this.canvasService.createObject({
 *     type: 'rectangle',
 *     x: 100,
 *     y: 100,
 *     width: 200,
 *     height: 150
 *   }).subscribe({
 *     next: (object) => console.log('Created:', object.id),
 *     error: (err) => console.error('Error:', err)
 *   });
 * }
 * ```
 * 
 * @see {@link CanvasStateService} for state management
 * @see {@link ValidationService} for validation rules
 * @see {@link CanvasHistoryService} for undo/redo
 */
@Injectable({
  providedIn: 'root'
})
export class CanvasService {
  // ... implementation
}
```

### Method Documentation Template

```typescript
/**
 * Creates a new canvas object with the specified parameters.
 * 
 * @remarks
 * This method performs the following validations:
 * - Object count limit (BR-C-001): Maximum 10,000 objects
 * - Dimension limits (BR-C-002): 1px - 10,000px
 * - Valid color values (BR-C-003)
 * 
 * After validation, the object is added to state and recorded in history
 * for undo/redo support.
 * 
 * @param params - Object creation parameters
 * @returns Observable that emits the created CanvasObject on success
 * 
 * @throws {ErrorResponse} With code OBJECT_LIMIT_EXCEEDED if canvas has 10,000 objects
 * @throws {ErrorResponse} With code INVALID_DIMENSIONS if dimensions outside 1-10,000px
 * @throws {ErrorResponse} With code VALIDATION_ERROR for other validation failures
 * 
 * @example
 * Create a rectangle
 * ```typescript
 * const params: CreateObjectParams = {
 *   type: 'rectangle',
 *   x: 100,
 *   y: 100,
 *   width: 200,
 *   height: 150,
 *   fill: '#FF0000',
 *   stroke: '#000000'
 * };
 * 
 * this.canvasService.createObject(params).subscribe({
 *   next: (object) => {
 *     console.log('Rectangle created with ID:', object.id);
 *   },
 *   error: (error) => {
 *     if (error.error.code === 'OBJECT_LIMIT_EXCEEDED') {
 *       this.showLimitWarning();
 *     }
 *   }
 * });
 * ```
 * 
 * @example
 * Create a circle
 * ```typescript
 * this.canvasService.createObject({
 *   type: 'circle',
 *   x: 300,
 *   y: 300,
 *   radius: 50,
 *   fill: '#00FF00'
 * }).subscribe({
 *   next: (circle) => console.log('Circle created:', circle)
 * });
 * ```
 */
createObject(params: CreateObjectParams): Observable<CanvasObject> {
  // Implementation
}
```

### Interface Documentation Template

```typescript
/**
 * Represents a canvas object (shape, text, image, or group).
 * 
 * @remarks
 * All canvas objects share common properties for position, styling, and
 * transformation. Shape-specific properties (width, height, radius, etc.)
 * are optional and determined by the object type.
 * 
 * Object IDs are generated using UUID v4 format and must be unique within
 * a canvas. Objects are organized into layers, with each object belonging
 * to exactly one layer.
 * 
 * @example
 * Create a rectangle object
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
 *   stroke: '#000000',
 *   strokeWidth: 2,
 *   opacity: 1,
 *   rotation: 0,
 *   scaleX: 1,
 *   scaleY: 1,
 *   skewX: 0,
 *   skewY: 0,
 *   locked: false,
 *   visible: true,
 *   draggable: true,
 *   zIndex: 0,
 *   metadata: {},
 *   createdAt: new Date(),
 *   updatedAt: new Date()
 * };
 * ```
 * 
 * @see {@link CanvasObjectType} for available object types
 * @see {@link Layer} for layer information
 */
export interface CanvasObject {
  /**
   * Unique identifier for the object (UUID v4 format).
   * Generated automatically on creation.
   * 
   * @example
   * ```typescript
   * import { v4 as uuidv4 } from 'uuid';
   * const id = uuidv4(); // "123e4567-e89b-12d3-a456-426614174000"
   * ```
   */
  id: string;

  /**
   * Type of canvas object.
   * Determines which properties are required/optional.
   * 
   * @see {@link CanvasObjectType}
   */
  type: CanvasObjectType;

  /**
   * ID of the layer this object belongs to.
   * Objects can only belong to one layer at a time.
   * 
   * @default 'default'
   */
  layerId: string;

  /**
   * X coordinate of object's top-left corner in pixels.
   * Origin (0,0) is at canvas top-left.
   * 
   * @remarks
   * For circles, this is the center X coordinate.
   * For rotated objects, this is the pre-rotation position.
   */
  x: number;

  /**
   * Y coordinate of object's top-left corner in pixels.
   * Origin (0,0) is at canvas top-left.
   * 
   * @remarks
   * For circles, this is the center Y coordinate.
   * For rotated objects, this is the pre-rotation position.
   */
  y: number;

  /**
   * Width of object in pixels (for rectangles, images, etc.).
   * 
   * @remarks
   * Required for: rectangle, image, text
   * Optional for: ellipse, group
   * Not used for: circle, line, polygon
   * 
   * Constraints (BR-C-002):
   * - Minimum: 1px
   * - Maximum: 10,000px
   */
  width?: number;

  // ... rest of properties with detailed JSDoc
}
```

### Component Documentation Template

```typescript
/**
 * Canvas editor container component providing full canvas editing experience.
 * 
 * @remarks
 * This component integrates the canvas stage, toolbar, properties panel, and
 * layers panel into a cohesive editor interface. It manages keyboard shortcuts,
 * state synchronization, and coordinates interactions between child components.
 * 
 * Features:
 * - Shape drawing tools (rectangle, circle, line, polygon)
 * - Object selection and manipulation (drag, resize, rotate)
 * - Undo/redo support (Ctrl+Z, Ctrl+Y)
 * - Export/import (PNG, JPEG, JSON)
 * - Layer management
 * - Auto-save to IndexedDB
 * 
 * @example
 * Basic usage in application
 * ```html
 * <canvas-editor
 *   [initialCanvas]="canvasData"
 *   (canvasSaved)="onCanvasSaved($event)"
 *   (canvasExported)="onCanvasExported($event)">
 * </canvas-editor>
 * ```
 * 
 * @example
 * With custom size
 * ```html
 * <canvas-editor
 *   [canvasWidth]="1600"
 *   [canvasHeight]="1200"
 *   [autoSave]="true"
 *   [autoSaveInterval]="60000">
 * </canvas-editor>
 * ```
 * 
 * @see {@link CanvasStageComponent} for stage rendering
 * @see {@link CanvasToolbarComponent} for tool selection
 * @see {@link CanvasService} for canvas operations
 */
@Component({
  selector: 'canvas-editor',
  standalone: true,
  templateUrl: './canvas-editor.component.html',
  styleUrls: ['./canvas-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CanvasEditorComponent implements OnInit, OnDestroy {
  // ... implementation
}
```

---

## README Documentation

### Library README

**File**: `libs/canvas-feature/README.md`

```markdown
# Canvas Feature Library

> Comprehensive canvas editing library for Angular 18+ applications using ng2-konva.

## Features

- ✨ **Modern Angular**: Built with Angular 18.2+, Signals, standalone components
- 🎨 **Rich Drawing Tools**: Rectangle, circle, ellipse, line, polygon, text, image
- 🔄 **Undo/Redo**: Full history support with 50-level stack
- 💾 **Persistence**: Auto-save to IndexedDB with cloud sync ready
- 📤 **Export/Import**: PNG, JPEG, JSON formats
- 🎯 **Performance**: Handles 10,000+ objects at 60fps
- ♿ **Accessible**: WCAG 2.1 AA compliant with keyboard navigation
- 📱 **Mobile-Friendly**: Touch interactions and responsive design

## Installation

```bash
yarn add @buildmotion-ai/canvas-feature ng2-konva konva
```

## Quick Start

### 1. Import Module

```typescript
import { Component } from '@angular/core';
import { CanvasEditorComponent } from '@buildmotion-ai/canvas-feature';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CanvasEditorComponent],
  template: '<canvas-editor></canvas-editor>'
})
export class AppComponent {}
```

### 2. Add Styles

```scss
// Add to global styles or component styles
@import '@buildmotion-ai/canvas-feature/styles/canvas-theme.scss';
```

### 3. Use in Template

```html
<canvas-editor
  [canvasWidth]="1200"
  [canvasHeight]="800"
  [autoSave]="true"
  (canvasSaved)="onSave($event)"
  (canvasExported)="onExport($event)">
</canvas-editor>
```

## API Documentation

### Components

#### CanvasEditorComponent

Full-featured canvas editor with toolbar, properties panel, and layers.

**Inputs:**
- `canvasWidth: number` - Canvas width in pixels (default: 1200)
- `canvasHeight: number` - Canvas height in pixels (default: 800)
- `autoSave: boolean` - Enable auto-save (default: true)
- `autoSaveInterval: number` - Auto-save interval in ms (default: 60000)
- `initialCanvas?: CanvasSnapshot` - Load existing canvas data

**Outputs:**
- `canvasSaved: EventEmitter<CanvasSnapshot>` - Emitted when canvas saved
- `canvasExported: EventEmitter<Blob>` - Emitted when canvas exported
- `objectCreated: EventEmitter<CanvasObject>` - Emitted when object created
- `objectSelected: EventEmitter<CanvasObject>` - Emitted when object selected

**Methods:**
- `save(): Observable<void>` - Manually trigger save
- `export(format: 'png' | 'jpeg' | 'json'): Observable<Blob | string>` - Export canvas
- `clear(): void` - Clear all objects
- `reset(): void` - Reset canvas to initial state

#### CanvasViewerComponent

Read-only canvas viewer for displaying saved canvases.

**Inputs:**
- `canvas: CanvasSnapshot` - Canvas data to display
- `width?: number` - Viewer width (default: auto)
- `height?: number` - Viewer height (default: auto)
- `interactive: boolean` - Enable pan/zoom (default: false)

### Services

#### CanvasService

Primary service for canvas operations.

```typescript
@Injectable({ providedIn: 'root' })
export class CanvasService {
  createObject(params: CreateObjectParams): Observable<CanvasObject>;
  updateObject(object: CanvasObject): Observable<CanvasObject>;
  deleteObject(objectId: string): Observable<void>;
  // ... see API docs for complete list
}
```

#### CanvasStateService

Centralized state management with Angular Signals.

```typescript
@Injectable({ providedIn: 'root' })
export class CanvasStateService {
  readonly objects: Signal<CanvasObject[]>;
  readonly selectedObjects: Signal<CanvasObject[]>;
  readonly activeTool: Signal<Tool>;
  readonly canvasSize: Signal<CanvasSize>;
  // ... see API docs for complete list
}
```

## Examples

### Creating Objects Programmatically

```typescript
import { inject } from '@angular/core';
import { CanvasService } from '@buildmotion-ai/canvas-feature';

export class MyComponent {
  private canvasService = inject(CanvasService);

  createRectangle(): void {
    this.canvasService.createObject({
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      fill: '#FF0000',
      stroke: '#000000'
    }).subscribe({
      next: (object) => console.log('Created:', object.id),
      error: (err) => console.error('Error:', err)
    });
  }
}
```

### Accessing Canvas State

```typescript
import { inject, effect } from '@angular/core';
import { CanvasStateService } from '@buildmotion-ai/canvas-feature';

export class MyComponent {
  private stateService = inject(CanvasStateService);

  constructor() {
    // React to object count changes
    effect(() => {
      const count = this.stateService.objectCount();
      console.log('Object count:', count);
    });

    // React to selection changes
    effect(() => {
      const selected = this.stateService.selectedObjects();
      console.log('Selected:', selected.length);
    });
  }
}
```

### Export Canvas

```typescript
import { inject } from '@angular/core';
import { CanvasExportService } from '@buildmotion-ai/canvas-feature';

export class MyComponent {
  private exportService = inject(CanvasExportService);

  exportAsPNG(): void {
    this.exportService.exportToPNG(this.stage, { scale: 2 })
      .subscribe(blob => {
        this.exportService.downloadPNG('my-canvas.png', blob);
      });
  }

  exportAsJSON(): void {
    this.exportService.exportToJSON()
      .subscribe(json => {
        this.exportService.downloadJSON('my-canvas.json', json);
      });
  }
}
```

## Configuration

### Canvas Limits

Default limits can be customized:

```typescript
import { MAX_OBJECT_COUNT, AUTO_SAVE_INTERVAL_MS } from '@buildmotion-ai/canvas-feature';

// Custom limits
const customLimits = {
  maxObjectCount: 5000,  // Default: 10,000
  autoSaveInterval: 30000  // Default: 60,000ms
};
```

### Validation Rules

Business rules enforced by the library:

- **BR-C-001**: Maximum 10,000 objects per canvas
- **BR-C-002**: Object dimensions: 1px - 10,000px
- **BR-C-003**: Valid color formats (hex, RGB, RGBA)
- **BR-V-001**: Image uploads: Max 10MB, PNG/JPEG/SVG/WebP only
- **BR-S-001**: Undo/redo stack: 50 operations
- **BR-S-002**: Auto-save: Every 60 seconds

## Browser Support

- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅
- Mobile Chrome (Android) ✅
- Mobile Safari (iOS) ✅

## Performance

- **60fps** with 1,000 objects
- **30fps** with 10,000 objects
- Load time: < 2 seconds for 5,000 objects
- Export time: < 5 seconds for full canvas
- Memory: < 100MB typical, < 500MB max

## Accessibility

- WCAG 2.1 AA compliant
- Full keyboard navigation
- Screen reader support
- Focus management
- ARIA labels and live regions

## Testing

```bash
# Unit tests
nx test canvas-feature

# E2E tests
nx e2e canvas-feature-e2e

# Test coverage
nx test canvas-feature --code-coverage
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## License

MIT

## Support

- 📖 [Full Documentation](https://docs.buildmotion.ai/canvas)
- 🐛 [Report Issues](https://github.com/buildmotion-ai/canvas/issues)
- 💬 [Discussions](https://github.com/buildmotion-ai/canvas/discussions)
```

---

## API Documentation (TypeDoc)

### TypeDoc Configuration

**File**: `libs/canvas-feature/typedoc.json`

```json
{
  "entryPoints": ["./src/index.ts"],
  "out": "./docs/api",
  "name": "Canvas Feature Library",
  "excludePrivate": true,
  "excludeProtected": false,
  "excludeInternal": true,
  "readme": "./README.md",
  "theme": "default",
  "includeVersion": true,
  "categorizeByGroup": true,
  "categoryOrder": [
    "Components",
    "Services",
    "Models",
    "Directives",
    "Pipes",
    "Utilities",
    "*"
  ],
  "navigation": {
    "includeCategories": true,
    "includeGroups": true
  }
}
```

### Generate API Docs

```bash
# Install TypeDoc
yarn add -D typedoc

# Generate docs
npx typedoc --options libs/canvas-feature/typedoc.json

# View docs
open libs/canvas-feature/docs/api/index.html
```

---

## Architecture Documentation

### Architecture Decision Records (ADRs)

**File**: `libs/canvas-feature/docs/adr/001-use-ng2-konva.md`

```markdown
# ADR 001: Use ng2-konva for Canvas Rendering

## Status

Accepted

## Context

We need a reliable canvas rendering library that:
- Integrates well with Angular
- Provides high-performance rendering
- Supports complex shape manipulation
- Has TypeScript support
- Is actively maintained

## Decision

We will use ng2-konva as our canvas rendering library.

## Rationale

### Alternatives Considered

1. **Fabric.js**
   - ❌ No official Angular integration
   - ❌ jQuery dependency
   - ✅ Feature-rich

2. **HTML5 Canvas (Native)**
   - ❌ Low-level, requires extensive custom code
   - ✅ No dependencies
   - ❌ Complex object management

3. **ng2-konva** (Selected)
   - ✅ Official Angular integration
   - ✅ TypeScript support
   - ✅ High performance (70KB gzipped)
   - ✅ Active maintenance
   - ✅ Excellent documentation

### Proof of Concept Results

- Bundle size: 70KB gzipped ✅ (target: <100KB)
- Performance: 60fps @ 1K objects ✅
- Mobile support: Excellent ✅
- TypeScript integration: Seamless ✅

## Consequences

### Positive

- Fast development with Angular-native components
- High performance out of the box
- Strong TypeScript support reduces bugs
- Small bundle size impact

### Negative

- Learning curve for Konva-specific patterns
- Dependency on external library maintenance

### Mitigation

- Document all Konva integration patterns
- Create abstraction layer for critical operations
- Monitor library for updates and security patches

## References

- ng2-konva: https://github.com/rafaesc/ng2-konva
- Konva.js: https://konvajs.org/
- POC Results: ../poc/poc-summary.md
```

### System Architecture Diagram

**File**: `libs/canvas-feature/docs/architecture/system-overview.md`

```markdown
# System Architecture Overview

## Component Hierarchy

```
CanvasEditorComponent (Container)
├── CanvasToolbarComponent
│   ├── Tool buttons (select, shapes, etc.)
│   └── Action buttons (undo, redo, export)
├── CanvasStageComponent
│   ├── ko-stage (ng2-konva)
│   ├── ko-layer (objects layer)
│   └── ko-layer (selection layer)
├── PropertiesPanelComponent
│   ├── Position controls
│   ├── Size controls
│   ├── Style controls
│   └── Transform controls
└── LayersPanelComponent
    └── LayerItemComponent (repeated)
```

## Service Architecture

```
CanvasService (Orchestration)
├── CanvasStateService (State Management)
├── CanvasHistoryService (Undo/Redo)
├── ValidationService (Business Rules)
├── CanvasExportService (Export/Import)
└── CanvasStorageService (Persistence)
```

## Data Flow

### Object Creation Flow

1. User drags on canvas → `CanvasStageComponent.onStageMouseDown()`
2. Component emits `objectCreate` event → `CanvasEditorComponent.onObjectCreate()`
3. Editor calls `CanvasService.createObject()`
4. Service validates with `ValidationService.validateObjectCreation()`
5. Service adds to state `CanvasStateService.addObject()`
6. Service records history `CanvasHistoryService.recordAction()`
7. Signal updates trigger template re-render
8. Canvas displays new object

### State Synchronization

All state flows through `CanvasStateService` using Angular Signals:

```typescript
objects: WritableSignal<CanvasObject[]>
    ↓
selectedObjects: ComputedSignal<CanvasObject[]>
    ↓
Template updates automatically
```

## Integration Points

- **ng2-konva**: Canvas rendering via `<ko-stage>`, `<ko-layer>`, `<ko-rect>`, etc.
- **IndexedDB**: Local persistence via `CanvasStorageService`
- **Browser APIs**: File API for image upload, Canvas API for export
- **PrimeNG**: UI components for toolbar, panels, dialogs

## Performance Considerations

- OnPush change detection for all components
- Signal-based reactivity for efficient updates
- Virtual scrolling for layer/object lists (>100 items)
- Konva layer caching for complex canvases
- Object pooling for repeated create/delete operations
```

---

## User Guide

### User Guide Structure

**File**: `docs/user-guide/getting-started.md`

```markdown
# Getting Started with Canvas Editor

## Introduction

The Canvas Editor provides a powerful, intuitive interface for creating and editing graphics directly in your browser. This guide will help you get started.

## Opening the Editor

Navigate to `/canvas/editor` in your application to open the canvas editor.

## Interface Overview

![Canvas Editor Interface](./images/interface-overview.png)

1. **Toolbar** (Left): Drawing tools and actions
2. **Canvas** (Center): Main editing area
3. **Properties Panel** (Right): Object properties
4. **Layers Panel** (Bottom-right): Layer management

## Drawing Your First Shape

### Rectangle

1. Click the Rectangle tool (📐) in the toolbar
2. Click and drag on the canvas to draw
3. Release to create the rectangle

![Drawing Rectangle](./images/draw-rectangle.gif)

### Circle

1. Click the Circle tool (⭕) in the toolbar
2. Click and drag from center outward
3. Release to create the circle

### Line

1. Click the Line tool (—) in the toolbar
2. Click start point, then end point
3. Line is created between points

## Selecting and Moving Objects

1. Click the Select tool (↖️) in the toolbar
2. Click on any object to select it
3. Drag the object to move it
4. Selected objects show resize handles

![Selecting Objects](./images/select-object.gif)

## Resizing Objects

1. Select an object
2. Grab any corner handle
3. Drag to resize
4. Hold Shift to maintain aspect ratio

## Rotating Objects

1. Select an object
2. Properties panel shows "Rotation" slider
3. Adjust slider or enter degrees
4. Object rotates around its center

## Changing Colors

### Fill Color

1. Select an object
2. In Properties panel, click Fill color swatch
3. Choose color from picker
4. Object fill updates immediately

### Stroke Color

1. Select an object
2. In Properties panel, click Stroke color swatch
3. Choose color from picker
4. Object outline updates immediately

## Undo and Redo

- **Undo**: Ctrl+Z (⌘+Z on Mac) or click Undo button
- **Redo**: Ctrl+Y (⌘+Shift+Z on Mac) or click Redo button
- Up to 50 operations can be undone

## Saving Your Work

The canvas auto-saves every 60 seconds to your browser's storage.

### Manual Save

Click the Save button (💾) in the toolbar to save immediately.

### Save Indicator

- **Green checkmark**: Saved successfully
- **Yellow spinner**: Saving in progress
- **Red X**: Save failed (check console)

## Exporting Your Canvas

1. Click the Export button (⬇️) in the toolbar
2. Choose export format:
   - **PNG**: High-quality raster image
   - **JPEG**: Compressed raster image
   - **JSON**: Canvas data (can be re-imported)
3. File downloads to your Downloads folder

## Keyboard Shortcuts

| Action | Windows/Linux | Mac |
|--------|---------------|-----|
| Select tool | V | V |
| Rectangle tool | R | R |
| Circle tool | C | C |
| Line tool | L | L |
| Delete selected | Delete | Delete |
| Undo | Ctrl+Z | ⌘+Z |
| Redo | Ctrl+Y | ⌘+Shift+Z |
| Save | Ctrl+S | ⌘+S |
| Select all | Ctrl+A | ⌘+A |

## Layers

### Creating a Layer

1. Open Layers panel (bottom-right)
2. Click "New Layer" button
3. Layer appears in list
4. Draw objects on the new layer

### Reordering Layers

1. In Layers panel, drag layer up or down
2. Higher layers appear on top

### Hiding/Showing Layers

1. In Layers panel, click eye icon
2. Layer objects become hidden/visible

### Locking Layers

1. In Layers panel, click lock icon
2. Layer objects cannot be selected or edited

## Tips and Tricks

### Precise Positioning

- Use Properties panel to enter exact X/Y coordinates
- Grid snap (if enabled) helps align objects

### Duplicate Objects

- Select object, then Ctrl+D (⌘+D) to duplicate

### Multi-Select

- Hold Ctrl (⌘) and click objects to select multiple
- Or drag a selection box around objects

### Zoom In/Out

- Ctrl+Mouse Wheel (⌘+Mouse Wheel) to zoom
- Zoom controls in top-right corner

## Need Help?

- [API Documentation](../api/index.html)
- [Video Tutorials](https://youtube.com/buildmotion-canvas)
- [Community Forum](https://github.com/buildmotion-ai/canvas/discussions)
- [Report Issues](https://github.com/buildmotion-ai/canvas/issues)
```

---

## Contributing Guide

**File**: `libs/canvas-feature/CONTRIBUTING.md`

```markdown
# Contributing to Canvas Feature Library

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

See [Development Environment](./docs/development-environment.md) for detailed setup instructions.

### Quick Setup

```bash
# Clone repository
git clone https://github.com/buildmotion-ai/buildmotion-ai-agency.git
cd buildmotion-ai-agency

# Install dependencies
yarn install

# Run tests
nx test canvas-feature --watch

# Start dev server
nx serve agency
```

## Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Write code following our [Code Structure](./docs/code-structure.md)
- Add JSDoc comments for all public APIs
- Write unit tests for new functionality
- Update integration tests if needed

### 3. Run Tests

```bash
# Unit tests
nx test canvas-feature

# Lint
nx lint canvas-feature

# E2E tests
nx e2e canvas-feature-e2e
```

### 4. Commit Changes

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: <type>(<scope>): <description>

git commit -m "feat(canvas): add polygon drawing tool"
git commit -m "fix(export): resolve PNG export quality issue"
git commit -m "docs(readme): update API examples"
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Code Standards

### TypeScript

- Use strict TypeScript mode
- Explicit return types on all functions
- No `any` types without justification
- Prefer `interface` over `type` for object shapes

### Angular

- Standalone components only
- OnPush change detection strategy
- Signal-based state management
- Inject services via `inject()` function

### Testing

- Minimum 80% code coverage
- Test happy path, error cases, and edge cases
- Use descriptive test names
- Follow AAA pattern (Arrange-Act-Assert)

### Documentation

- JSDoc comments on all public APIs
- Inline comments for complex logic
- Update README for new features
- Add examples to documentation

## Pull Request Process

1. **Ensure tests pass**: All tests must pass before merging
2. **Update documentation**: README, API docs, user guide
3. **Code review**: At least one approval required
4. **Address feedback**: Respond to all review comments
5. **Squash commits**: Maintain clean git history

## Questions?

- Join our [Discord](https://discord.gg/buildmotion)
- Open a [Discussion](https://github.com/buildmotion-ai/canvas/discussions)
- Email: support@buildmotion.ai
```

---

## Documentation Checklist

**Code Documentation**:
- [ ] All services have JSDoc comments
- [ ] All public methods documented
- [ ] All interfaces/types documented
- [ ] All components documented
- [ ] Examples provided for complex APIs
- [ ] Error codes documented
- [ ] Business rules referenced (BR-*)

**README Files**:
- [ ] Library README complete
- [ ] Installation instructions clear
- [ ] Quick start guide provided
- [ ] API overview included
- [ ] Examples demonstrate key features
- [ ] Configuration options documented

**API Documentation**:
- [ ] TypeDoc configuration complete
- [ ] API docs generate without errors
- [ ] All public APIs appear in docs
- [ ] Categories organized logically
- [ ] Navigation is intuitive

**Architecture Documentation**:
- [ ] ADRs written for key decisions
- [ ] System architecture diagram created
- [ ] Component hierarchy documented
- [ ] Data flow diagrams provided
- [ ] Integration points documented

**User Guide**:
- [ ] Getting started guide complete
- [ ] Screenshots/GIFs included
- [ ] Common tasks documented
- [ ] Keyboard shortcuts listed
- [ ] Tips and tricks provided
- [ ] Troubleshooting section included

**Contributing Guide**:
- [ ] Development setup documented
- [ ] Workflow explained clearly
- [ ] Code standards defined
- [ ] PR process outlined
- [ ] Contact information provided

---

## Documentation Maintenance

### Update Triggers

Update documentation when:
- New features added → Update README, API docs, user guide
- API changes → Update API docs, examples
- Architecture changes → Update ADRs, diagrams
- Breaking changes → Update migration guide, changelog

### Documentation Review

- Review documentation in every PR
- Keep screenshots/GIFs up to date
- Ensure code examples actually work
- Check links are not broken
- Validate TypeDoc generates correctly

---

**Specification Complete**: 06-documentation-requirements ✅  
**All 6 Development Specifications Complete!** 🎉
