# World Viewport Feature

## Overview

The World Viewport feature visualizes the Nx workspace dependency graph as an interactive canvas within the `agent-alchemy-dev` application. It leverages the `@buildmotion-ai/canvas-feature` library and ng2-konva to render workspace nodes (applications, libraries, e2e projects) as interactive shapes and their dependencies as connecting lines.

## Feature Location

**Application:** `apps/agent-alchemy-dev`  
**Route:** `/world-viewport`  
**Library:** `libs/agency/canvas-feature/canvas-feature`

## Core Capabilities

| Capability | Description |
|---|---|
| Graph Visualization | Render workspace nodes as colored rectangles grouped by type |
| Dependency Edges | Draw lines between dependent nodes |
| Zoom & Pan | Scroll to zoom; drag to pan the viewport |
| Node Selection | Click to select/highlight a node |
| Type Color Coding | Apps=blue, Libs=green, E2E=amber |
| Stats Overlay | Show total nodes and edges count |

## Components

| Component | Path | Purpose |
|---|---|---|
| `WorldViewportComponent` | `canvas-feature/src/lib/components/world-viewport/` | Main canvas viewport |
| `WorkspaceGraphVisualizationService` | `canvas-feature/src/lib/services/` | Loads and layouts graph data |

## Data Source

The feature loads workspace graph data from `/assets/workspace-graph.json` which is generated from the Nx workspace. The JSON format follows the `NxGraphData` interface.

## Layout Algorithm

Nodes are grouped by type into horizontal rows:
- **Row 0** – Applications (type=`app`)
- **Row 1** – Libraries (type=`lib`)  
- **Row 2** – E2E projects (type=`e2e`)

Within each row, nodes are evenly spaced. A 200×80px rectangle with the project name is rendered for each node.

## Testing

- **Unit:** ≥90% code coverage via Jest
- **E2E:** Playwright tests in `apps/agent-alchemy-dev-e2e`

## Specifications Index

- `feature.specification.md` – Functional requirements
- `architecture.specification.md` – Technical design
- `testing.specification.md` – Testing strategy
