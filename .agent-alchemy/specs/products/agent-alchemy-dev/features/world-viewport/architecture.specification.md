---
meta:
  id: agent-alchemy-dev-world-viewport-architecture-specification
  title: Architecture Specification
  version: 1.0.0
  status: draft
  specType: specification
  scope: product:agent-alchemy-dev
  tags: []
  createdBy: unknown
  createdAt: '2026-03-12'
  reviewedAt: null
title: Architecture Specification
category: Products
feature: world-viewport
lastUpdated: '2026-03-12'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: agent-alchemy-dev
phase: develop
applyTo: []
keywords: []
topics: []
useCases: []
---

# World Viewport – Architecture

## Layer Diagram

```
apps/agent-alchemy-dev
  └── /world-viewport (route)
       └── WorldViewportComponent   ← canvas-feature lib
            ├── WorkspaceGraphVisualizationService
            │    ├── HttpClient (loads /assets/workspace-graph.json)
            │    └── layout algorithm (grid by node type)
            └── ng2-konva (StageComponent, CoreShapeComponent)
```

## Component Design

### `WorldViewportComponent`

| Attribute | Value |
|---|---|
| Selector | `lib-world-viewport` |
| Strategy | `OnPush` |
| Library | `@buildmotion-ai/canvas-feature` |
| Standalone | `true` |

**Injected services:**
- `WorkspaceGraphVisualizationService` – provides graph nodes/edges as signals
- `HttpClient` – passed to service for data loading

**Template structure:**
```html
<div class="world-viewport-container">
  <ko-stage [config]="stageConfig()" (wheel)="onWheel($event)">
    <ko-layer>
      <!-- edges (lines) rendered first, below nodes -->
      @for (edge of graphEdges(); track edge.id) { ... }
      <!-- nodes (rectangles + text) -->
      @for (node of graphNodes(); track node.id) { ... }
    </ko-layer>
  </ko-stage>
  <div class="stats-bar">Nodes: N | Edges: M</div>
</div>
```

### `WorkspaceGraphVisualizationService`

| Attribute | Value |
|---|---|
| Injectable | `{ providedIn: 'root' }` |
| Pattern | Signals-based state |

**Public API:**
```typescript
readonly loading: Signal<boolean>
readonly error: Signal<string | null>
readonly graphNodes: Signal<WorkspaceNodeViewModel[]>
readonly graphEdges: Signal<WorkspaceEdgeViewModel[]>
readonly nodeCount: Signal<number>
readonly edgeCount: Signal<number>

loadGraph(data: NxGraphData): void
```

## Data Models

### `NxGraphData`
```typescript
interface NxGraphData {
  graph: {
    nodes: Record<string, NxNode>;
    dependencies: Record<string, NxDependency[]>;
  };
}

interface NxNode {
  name: string;
  type: 'app' | 'lib' | 'e2e';
  data: { root: string; tags?: string[] };
}

interface NxDependency {
  source: string;
  target: string;
  type: string;
}
```

### `WorkspaceNodeViewModel`
```typescript
interface WorkspaceNodeViewModel {
  id: string;
  name: string;
  nodeType: 'app' | 'lib' | 'e2e';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  selected: boolean;
}
```

### `WorkspaceEdgeViewModel`
```typescript
interface WorkspaceEdgeViewModel {
  id: string;
  from: string;   // node id
  to: string;     // node id
  points: number[];
}
```

## Layout Algorithm

```
NODE_WIDTH  = 200
NODE_HEIGHT = 80
H_SPACING   = 240   (horizontal gap between nodes)
V_SPACING   = 160   (vertical gap between rows)
OFFSET_X    = 60
OFFSET_Y    = 60

rows = { app: 0, lib: 1, e2e: 2 }
for each type group (apps, libs, e2e):
  y = OFFSET_Y + rows[type] * V_SPACING
  for index, node in group:
    x = OFFSET_X + index * H_SPACING
    position[node.id] = { x, y }
```

## Asset Configuration

`nx-graph.json` is copied to `apps/agent-alchemy-dev/public/assets/workspace-graph.json` via the build assets configuration.

## ADR-WV-001 – Use ng2-konva for Canvas Rendering

**Decision:** Continue using ng2-konva (already used by canvas-feature).  
**Rationale:** Consistent with existing canvas-feature library. Angular-idiomatic API. Avoid additional dependencies.  
**Consequences:** Canvas not accessible to screen readers; mitigated by stats overlay and keyboard nav.

## ADR-WV-002 – Static JSON Asset vs. API

**Decision:** Load pre-generated `workspace-graph.json` from static assets.  
**Rationale:** Simpler deployment; no server-side API required. Works with static hosting (Vercel).  
**Consequences:** Graph must be regenerated when workspace changes; acceptable for demo use.
