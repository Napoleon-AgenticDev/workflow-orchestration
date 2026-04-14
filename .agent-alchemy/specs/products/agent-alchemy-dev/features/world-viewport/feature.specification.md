---
meta:
  id: agent-alchemy-dev-world-viewport-feature-specification
  title: Feature Specification
  version: 2.0.0
  status: draft
  specType: specification
  scope: product:agent-alchemy-dev
  tags: []
  createdBy: unknown
  createdAt: '2026-03-12'
  reviewedAt: null
title: Feature Specification
category: Products
feature: world-viewport
lastUpdated: '2026-03-12'
source: Agent Alchemy
version: 2.0.0
aiContext: true
product: agent-alchemy-dev
phase: develop
applyTo: []
keywords: []
topics: []
useCases: []
---

# World Viewport – 3-D Workspace Graph Visualisation

## Purpose

Display the Nx workspace dependency graph as an **interactive 3-D WebGL scene** so
developers can visually explore project relationships by rotating, zooming, and panning
a force-directed graph in three dimensions.

## Technology

| Concern | Library |
|---------|---------|
| 3-D rendering | `3d-force-graph@^1.79.1` (Three.js / WebGL) |
| Node geometry | `three` (SphereGeometry, BoxGeometry, OctahedronGeometry) |
| Angular integration | Imperative API, dynamic import, NgZone boundary |
| State | Angular Signals (`signal`, `computed`) |
| Styles | Tailwind CSS utility classes (zero custom CSS except `::ng-deep canvas`) |

## Node Visual Language

| Type | 3-D Shape | Colour | Metaphor |
|------|-----------|--------|----------|
| `app` | Sphere | Indigo-blue glow (`#3b82f6`) | Planet / main body |
| `lib` | Cube | Emerald glow (`#10b981`) | Building block |
| `e2e` | Octahedron (diamond) | Amber glow (`#f59e0b`) | Shield / guard |

Selected nodes: violet-purple glow (`#c084fc`).

## Link Visual Language

| Relationship | Colour | Extras |
|-------------|--------|--------|
| app → lib | `#60a5fa` blue | Directional arrows + animated particles |
| app → e2e | `#fbbf24` amber | Directional arrows + animated particles |
| lib → lib | `#34d399` green | Directional arrows + animated particles |
| default | `#475569` slate | Directional arrows |

## Functional Requirements

### FR-WV-001 – Graph Data Loading
- **Given** the user navigates to `/world-viewport`
- **When** the component initialises
- **Then** it fetches `/assets/workspace-graph.json` via HTTP and renders the 3-D graph

### FR-WV-002 – Node Rendering
- **Given** graph data has been loaded
- **When** the 3-D scene renders
- **Then** each project node appears as a distinct Three.js mesh per type (sphere / cube / octahedron)

### FR-WV-003 – Link Rendering
- **Given** the graph contains dependencies
- **When** rendered
- **Then** links show directional arrows and animated flowing particles indicating data flow

### FR-WV-004 – 3-D Interaction
- **Given** the 3-D scene is rendered
- **When** the user interacts with the scene
- **Then**:
  - Drag → rotate the scene (orbit controls)
  - Scroll → zoom in / out
  - Right-drag → pan
  - Click node → select (purple highlight + info panel)
  - Click background → deselect
  - Click "Reset View" → `zoomToFit()`

### FR-WV-005 – Node Info Panel
- **Given** a node is selected
- **When** the info panel renders
- **Then** it displays: node name, type badge (with colour-coded icon), and a deselect button

### FR-WV-006 – Loading State
- **Given** the HTTP request is in-flight
- **When** the overlay renders
- **Then** a spinner overlay is shown; the WebGL scene remains in the DOM

### FR-WV-007 – Error Handling
- **Given** the HTTP request fails
- **When** the error overlay renders
- **Then** a user-friendly message and a "Try again" reload button are shown

### FR-WV-008 – Status Bar
- **Given** the graph is loaded
- **When** the status bar renders
- **Then** it shows: node count, edge count, selected node name (if any), and a renderer credit

## Non-Functional Requirements

- **Performance**: Force simulation runs outside Angular zone (`NgZone.runOutsideAngular`) to prevent unnecessary change-detection cycles
- **Bundle size**: `3d-force-graph` loaded via dynamic `import()` to keep initial chunk small
- **Accessibility**: All interactive HTML elements have `aria-label`; the WebGL scene provides tooltip labels via `nodeLabel`
- **Styling**: All HTML structure styled exclusively with Tailwind utilities; SCSS limited to one `::ng-deep canvas` override

## Test Coverage

Target: ≥ 90 % statement coverage on `WorldViewportComponent`.
Achieved: 27 unit tests, 100 % passing.
- `3d-force-graph` and `three` mocked via `jest.mock()` so tests never require WebGL.
- `HttpTestingController` used for all HTTP assertions.
- Playwright E2E tests cover route navigation, loading overlay, status bar, and node info panel.
