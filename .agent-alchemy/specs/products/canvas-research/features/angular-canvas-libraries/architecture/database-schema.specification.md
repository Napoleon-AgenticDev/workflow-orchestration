---
meta:
  id: canvas-research-angular-canvas-libraries-database-schema-specification
  title: Database Schema - Canvas Libraries for Angular
  version: 1.0.0
  status: draft
  specType: specification
  scope: product:canvas-research
  tags: []
  createdBy: Agent Alchemy Architecture
  createdAt: 2026-02-25T00:00:00.000Z
  reviewedAt: null
title: Database Schema - Canvas Libraries for Angular
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
  - plan/functional-requirements.specification.md
  - architecture/system-architecture.specification.md
specification: 03-database-schema
---

# Database Schema: Canvas Libraries for Angular

## Overview

**Purpose**: Define data storage schema for canvas feature persistence and state management.

**Storage Strategy**: Client-side only (browser storage)  
**Primary Storage**: IndexedDB  
**Fallback**: LocalStorage  
**Future Enhancement**: Optional cloud sync with Supabase

## Client-Side Storage Architecture

### Storage Technologies

1. **IndexedDB** (Primary)
   - Capacity: 50MB+ (browser-dependent)
   - Use: Canvas state auto-save, templates
   - Performance: Async, non-blocking
   - Transactions: Supported

2. **LocalStorage** (Fallback)
   - Capacity: ~5MB
   - Use: User preferences, small canvases
   - Performance: Sync, can block UI
   - Transactions: Not supported

3. **SessionStorage**
   - Capacity: ~5MB
   - Use: Temporary canvas state during session
   - Lifetime: Session only

## IndexedDB Schema

### Database: `canvas-library-db`
**Version**: 1
**Upgrade Path**: Versioned migrations

### Object Store: `canvases`

**Purpose**: Store canvas state snapshots

**Schema**:
```typescript
interface CanvasSnapshot {
  id: string;                    // UUID v4
  name: string;                  // User-defined canvas name
  objects: CanvasObject[];       // Array of canvas objects
  layers: Layer[];               // Layer definitions
  metadata: CanvasMetadata;      // Canvas configuration
  version: string;               // Schema version (e.g., "1.0.0")
  createdAt: Date;              // Timestamp
  updatedAt: Date;              // Last modified
  autoSaved: boolean;           // Auto-save vs manual save
}

interface CanvasObject {
  id: string;                    // Unique object ID
  type: 'rectangle' | 'circle' | 'line' | 'polygon' | 'text' | 'image' | 'path';
  layerId: string;              // Parent layer ID
  x: number;                    // Position X
  y: number;                    // Position Y
  width?: number;               // Width (for rect, image)
  height?: number;              // Height (for rect, image)
  radius?: number;              // Radius (for circle)
  points?: number[];            // Points (for polygon, line, path)
  text?: string;                // Text content (for text)
  fill: string;                 // Fill color (hex, rgb, rgba)
  stroke: string;               // Stroke color
  strokeWidth: number;          // Stroke width
  opacity: number;              // 0.0 - 1.0
  rotation: number;             // 0 - 360 degrees
  scaleX: number;               // X scale factor
  scaleY: number;               // Y scale factor
  locked: boolean;              // Is locked
  visible: boolean;             // Is visible
  zIndex: number;               // Stacking order
  metadata: Record<string, any>; // Custom metadata
}

interface Layer {
  id: string;                    // Unique layer ID
  name: string;                  // Layer name
  visible: boolean;              // Layer visibility
  locked: boolean;               // Layer locked
  opacity: number;               // Layer opacity
  zIndex: number;                // Layer order
}

interface CanvasMetadata {
  canvasWidth: number;           // Canvas width
  canvasHeight: number;          // Canvas height
  backgroundColor: string;       // Canvas background
  gridEnabled: boolean;          // Show grid
  gridSize: number;              // Grid size (px)
  snapToGrid: boolean;           // Snap to grid
  zoom: number;                  // Zoom level (1.0 = 100%)
}
```

**Indexes**:
- Primary Key: `id`
- Index: `updatedAt` (for sorting by recent)
- Index: `autoSaved` (for cleanup queries)
- Index: `name` (for search)

### Object Store: `canvas-history`

**Purpose**: Store undo/redo history per canvas

**Schema**:
```typescript
interface CanvasHistoryEntry {
  id: string;                    // UUID v4
  canvasId: string;              // Parent canvas ID
  action: HistoryAction;         // Action performed
  timestamp: Date;               // When action occurred
  state: CanvasSnapshot;         // State snapshot
}

type HistoryAction = 
  | 'create_object'
  | 'update_object'
  | 'delete_object'
  | 'move_object'
  | 'resize_object'
  | 'rotate_object'
  | 'change_layer'
  | 'create_layer'
  | 'delete_layer';
```

**Indexes**:
- Primary Key: `id`
- Index: `canvasId` (for canvas-specific history)
- Index: `timestamp` (for chronological order)

**History Management**:
- Maximum 50 entries per canvas
- Oldest entries auto-deleted when limit reached
- History cleared on canvas export/delete

### Object Store: `canvas-templates`

**Purpose**: Store reusable canvas templates

**Schema**:
```typescript
interface CanvasTemplate {
  id: string;                    // UUID v4
  name: string;                  // Template name
  description: string;           // Template description
  thumbnail: string;             // Base64 image data URL
  template: CanvasSnapshot;      // Template canvas state
  category: string;              // Template category
  tags: string[];                // Search tags
  createdAt: Date;              // Creation timestamp
}
```

**Indexes**:
- Primary Key: `id`
- Index: `name` (for search)
- Index: `category` (for filtering)

### Object Store: `user-preferences`

**Purpose**: Store user settings and preferences

**Schema**:
```typescript
interface UserPreferences {
  id: 'singleton';               // Single record
  theme: 'light' | 'dark';       // UI theme
  defaultCanvasSize: { width: number; height: number };
  autoSaveInterval: number;      // Auto-save frequency (seconds)
  showGrid: boolean;             // Default grid visibility
  snapToGrid: boolean;           // Default snap to grid
  defaultColors: {               // Default color palette
    fill: string;
    stroke: string;
  };
  keyboardShortcuts: Record<string, string>; // Custom shortcuts
  recentCanvases: string[];      // Recent canvas IDs
}
```

**Indexes**:
- Primary Key: `id` (always 'singleton')

## LocalStorage Schema (Fallback)

### Key: `canvas-current-state`

**Purpose**: Current editing session state (small canvases only)

**Format**: JSON string
**Max Size**: 4MB (safe limit)

```typescript
interface CurrentState {
  canvasId: string;
  snapshot: CanvasSnapshot;
  lastSaved: string; // ISO timestamp
}
```

### Key: `canvas-preferences`

**Purpose**: User preferences (if IndexedDB unavailable)

**Format**: JSON string

## Data Access Layer

### IndexedDB Service

```typescript
import { Injectable } from '@angular/core';
import { openDB, IDBPDatabase } from 'idb';

@Injectable({ providedIn: 'root' })
export class IndexedDBService {
  private db: IDBPDatabase | null = null;
  private readonly DB_NAME = 'canvas-library-db';
  private readonly DB_VERSION = 1;

  async initDB(): Promise<void> {
    this.db = await openDB(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Create object stores
        if (!db.objectStoreNames.contains('canvases')) {
          const canvasStore = db.createObjectStore('canvases', { keyPath: 'id' });
          canvasStore.createIndex('updatedAt', 'updatedAt');
          canvasStore.createIndex('autoSaved', 'autoSaved');
          canvasStore.createIndex('name', 'name');
        }

        if (!db.objectStoreNames.contains('canvas-history')) {
          const historyStore = db.createObjectStore('canvas-history', { keyPath: 'id' });
          historyStore.createIndex('canvasId', 'canvasId');
          historyStore.createIndex('timestamp', 'timestamp');
        }

        if (!db.objectStoreNames.contains('canvas-templates')) {
          const templateStore = db.createObjectStore('canvas-templates', { keyPath: 'id' });
          templateStore.createIndex('name', 'name');
          templateStore.createIndex('category', 'category');
        }

        if (!db.objectStoreNames.contains('user-preferences')) {
          db.createObjectStore('user-preferences', { keyPath: 'id' });
        }
      },
    });
  }

  async saveCanvas(snapshot: CanvasSnapshot): Promise<void> {
    if (!this.db) await this.initDB();
    await this.db!.put('canvases', snapshot);
  }

  async getCanvas(id: string): Promise<CanvasSnapshot | undefined> {
    if (!this.db) await this.initDB();
    return this.db!.get('canvases', id);
  }

  async getAllCanvases(): Promise<CanvasSnapshot[]> {
    if (!this.db) await this.initDB();
    return this.db!.getAll('canvases');
  }

  async deleteCanvas(id: string): Promise<void> {
    if (!this.db) await this.initDB();
    await this.db!.delete('canvases', id);
    // Also delete associated history
    const historyEntries = await this.getCanvasHistory(id);
    for (const entry of historyEntries) {
      await this.db!.delete('canvas-history', entry.id);
    }
  }

  async saveHistoryEntry(entry: CanvasHistoryEntry): Promise<void> {
    if (!this.db) await this.initDB();
    await this.db!.put('canvas-history', entry);
    
    // Enforce history limit per canvas
    const history = await this.getCanvasHistory(entry.canvasId);
    if (history.length > 50) {
      const toDelete = history
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .slice(0, history.length - 50);
      for (const old of toDelete) {
        await this.db!.delete('canvas-history', old.id);
      }
    }
  }

  async getCanvasHistory(canvasId: string): Promise<CanvasHistoryEntry[]> {
    if (!this.db) await this.initDB();
    return this.db!.getAllFromIndex('canvas-history', 'canvasId', canvasId);
  }

  async saveTemplate(template: CanvasTemplate): Promise<void> {
    if (!this.db) await this.initDB();
    await this.db!.put('canvas-templates', template);
  }

  async getTemplates(): Promise<CanvasTemplate[]> {
    if (!this.db) await this.initDB();
    return this.db!.getAll('canvas-templates');
  }

  async savePreferences(prefs: UserPreferences): Promise<void> {
    if (!this.db) await this.initDB();
    await this.db!.put('user-preferences', { ...prefs, id: 'singleton' });
  }

  async getPreferences(): Promise<UserPreferences | undefined> {
    if (!this.db) await this.initDB();
    return this.db!.get('user-preferences', 'singleton');
  }

  async clearAllData(): Promise<void> {
    if (!this.db) await this.initDB();
    await this.db!.clear('canvases');
    await this.db!.clear('canvas-history');
    await this.db!.clear('canvas-templates');
  }
}
```

## Storage Quota Management

### Quota Monitoring

```typescript
@Injectable({ providedIn: 'root' })
export class StorageQuotaService {
  async checkQuota(): Promise<{ used: number; available: number; percentage: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const available = estimate.quota || 0;
      const percentage = available > 0 ? (used / available) * 100 : 0;
      return { used, available, percentage };
    }
    return { used: 0, available: 0, percentage: 0 };
  }

  async warnIfLowSpace(): Promise<void> {
    const { percentage } = await this.checkQuota();
    if (percentage > 80) {
      // Show warning to user
      console.warn('Storage quota exceeded 80%');
    }
  }

  async cleanupOldAutoSaves(daysOld: number = 30): Promise<number> {
    // Delete auto-saved canvases older than X days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    // Implementation would query and delete old auto-saves
    return 0; // Return count of deleted items
  }
}
```

## Data Migration Strategy

### Version 1.0.0 → 2.0.0 (Example)

```typescript
async function migrateV1toV2(oldData: any): Promise<CanvasSnapshot> {
  // Add new fields, transform structure as needed
  return {
    ...oldData,
    version: '2.0.0',
    // Add new fields with defaults
    metadata: {
      ...oldData.metadata,
      snapToGrid: false, // New field in v2
    },
  };
}
```

## Future Enhancement: Cloud Sync

### Supabase Schema (Planned)

```sql
-- Future cloud storage (not in MVP)
CREATE TABLE canvas_snapshots (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  name TEXT NOT NULL,
  data JSONB NOT NULL,
  version TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_canvas_user ON canvas_snapshots(user_id);
CREATE INDEX idx_canvas_updated ON canvas_snapshots(updated_at DESC);
```

## Data Retention Policy

### Auto-Save Retention
- Auto-saves: 30 days
- Manual saves: Indefinite (user-managed)
- History: Per-canvas limit of 50 entries
- Templates: Indefinite

### Cleanup Strategy
- Weekly cleanup of old auto-saves
- On storage quota warning (>80%)
- User-initiated cleanup via settings

## Evaluation Criteria

- [x] Client-side storage architecture defined (IndexedDB + LocalStorage)
- [x] Complete schema for all data entities
- [x] Indexes for query optimization
- [x] Data access layer with TypeScript interfaces
- [x] Storage quota management strategy
- [x] Data migration approach documented
- [x] Retention policy defined
- [x] Future cloud sync consideration included
- [x] No server-side database required for MVP
- [x] Schemas match business rules from plan phase

---

**Specification**: 03-database-schema ✅  
**Next**: api-specifications.specification.md
