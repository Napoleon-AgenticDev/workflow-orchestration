---
meta:
  id: specs-products-agent-alchemy-dev-features-content-queue-architecture-ui-components
  title: UI Components Architecture - Content Queue Feature
  version: 1.0.0
  status: draft
  specType: specification
  scope: feature
  tags: []
  createdBy: unknown
  createdAt: '2026-02-24'
  reviewedAt: null
title: UI Components Architecture - Content Queue Feature
category: Products
feature: content-queue
lastUpdated: '2026-03-12'
source: Agent Alchemy
version: 1.0.0
aiContext: true
product: agent-alchemy-dev
phase: architecture
applyTo: []
keywords: []
topics: []
useCases: []
specification: ui-components
---

# UI Components Architecture: Content Queue Feature

## Overview

**Purpose**: Define all UI components, state management patterns, user interactions, and visual design for the Content Queue VS Code extension.

**UI Framework**: VS Code Extension API (TypeScript 5.5.2)
**State Management**: Reactive patterns with RxJS 7.8.0, Angular Signals (where applicable)
**Styling**: VS Code theming (respects user's theme)
**Accessibility**: WCAG 2.1 Level AA compliance

**Design Principles**:

1. **Keyboard-First**: All actions accessible via Command Palette
2. **Non-Intrusive**: Never block coding workflow
3. **Progressive Disclosure**: Show complexity when needed
4. **Consistent**: Follow VS Code UI patterns
5. **Responsive**: Instant feedback for all actions

---

## Component Hierarchy

```
ContentQueueExtension (Root)
├── Activation & Registration
│   ├── ExtensionContext
│   ├── CommandRegistry
│   └── ConfigurationManager
│
├── UI Components
│   ├── TreeView Components
│   │   ├── ContentQueueTreeDataProvider
│   │   ├── QueueItemTreeItem
│   │   └── QueueSectionTreeItem
│   │
│   ├── Webview Components
│   │   ├── SetupWizardWebview
│   │   ├── ContentPreviewWebview
│   │   ├── SchedulingDialogWebview
│   │   └── AnalyticsDashboardWebview
│   │
│   ├── Editor Components
│   │   ├── ContentEditorProvider
│   │   ├── MarkdownPreviewPanel
│   │   └── EditorToolbar
│   │
│   └── UI Elements
│       ├── StatusBarController
│       ├── NotificationService
│       └── QuickPickController
│
├── State Management
│   ├── QueueStateManager
│   ├── UserPreferencesManager
│   └── PlatformConnectionManager
│
└── Services
    ├── CommandService
    ├── FileSystemService
    ├── APIClientService
    └── ThemeService
```

---

## Core Component Specifications

### 1. Extension Activation Component

**Component**: `ContentQueueExtension`
**Type**: Entry Point
**Lifecycle**: Singleton

**Responsibilities**:

- Extension activation and deactivation
- Component registration and initialization
- Command palette integration
- Context menu registration
- Keybinding registration

**TypeScript Implementation**:

```typescript
// src/extension.ts

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext): void {
  console.log('Content Queue extension activating...');

  // Initialize services
  const fileSystemService = new FileSystemService(context);
  const apiClientService = new APIClientService();
  const queueStateManager = new QueueStateManager(fileSystemService);

  // Initialize UI components
  const statusBar = new StatusBarController(queueStateManager);
  const treeView = new ContentQueueTreeView(context, queueStateManager);
  const notificationService = new NotificationService();

  // Register commands
  const commandService = new CommandService(context, queueStateManager, treeView, notificationService);
  commandService.registerAllCommands();

  // Register views
  const treeViewProvider = new ContentQueueTreeDataProvider(queueStateManager);
  context.subscriptions.push(vscode.window.registerTreeDataProvider('contentQueue', treeViewProvider));

  // Show welcome notification for first-time users
  const isFirstActivation = context.globalState.get('firstActivation', true);
  if (isFirstActivation) {
    notificationService.showWelcome();
    context.globalState.update('firstActivation', false);
  }

  // Update status bar
  statusBar.update();

  console.log('Content Queue extension activated ✓');
}

export function deactivate(): void {
  console.log('Content Queue extension deactivating...');
  // Cleanup resources
}
```

**Configuration**:

```json
// package.json (extension manifest)
{
  "activationEvents": ["onStartupFinished", "onCommand:contentQueue.setup", "onView:contentQueue"],
  "contributes": {
    "commands": [
      {
        "command": "contentQueue.openQueue",
        "title": "Content Queue: Open Queue",
        "icon": "$(list-unordered)"
      }
      // ... more commands
    ],
    "views": {
      "explorer": [
        {
          "id": "contentQueue",
          "name": "Content Queue",
          "icon": "resources/icon.svg"
        }
      ]
    },
    "keybindings": [
      {
        "command": "contentQueue.openQueue",
        "key": "ctrl+shift+q",
        "mac": "cmd+shift+q"
      }
    ]
  }
}
```

---

### 2. TreeView Components

#### 2.1 ContentQueueTreeDataProvider

**Component**: `ContentQueueTreeDataProvider`
**Type**: TreeDataProvider
**Pattern**: Observer (reacts to queue state changes)

**Responsibilities**:

- Provide hierarchical tree structure
- React to queue state updates
- Handle tree item expansion/collapse
- Provide context menu items

**TypeScript Implementation**:

```typescript
// src/views/tree/ContentQueueTreeDataProvider.ts

import * as vscode from 'vscode';
import { QueueStateManager } from '../../state/QueueStateManager';
import { QueueSectionTreeItem } from './QueueSectionTreeItem';
import { QueueItemTreeItem } from './QueueItemTreeItem';

export class ContentQueueTreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<TreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private queueStateManager: QueueStateManager) {
    // Subscribe to state changes
    this.queueStateManager.onQueueUpdated(() => {
      this.refresh();
    });
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TreeItem): Promise<TreeItem[]> {
    if (!element) {
      // Root level: show sections
      return this.getRootSections();
    }

    if (element instanceof QueueSectionTreeItem) {
      // Section level: show items
      return this.getSectionItems(element.section);
    }

    return [];
  }

  private async getRootSections(): Promise<QueueSectionTreeItem[]> {
    const counts = await this.queueStateManager.getQueueCounts();

    return [
      new QueueSectionTreeItem('pending', '📝 Pending', counts.pending),
      new QueueSectionTreeItem('approved', '✅ Approved', counts.approved),
      new QueueSectionTreeItem('scheduled', '📅 Scheduled', counts.scheduled),
      new QueueSectionTreeItem('published', '📊 Published', counts.published),
      new QueueSectionTreeItem('rejected', '❌ Rejected', counts.rejected),
    ];
  }

  private async getSectionItems(section: string): Promise<QueueItemTreeItem[]> {
    const items = await this.queueStateManager.getQueueItems(section);
    return items.map((item) => new QueueItemTreeItem(item));
  }
}
```

#### 2.2 QueueSectionTreeItem

**Component**: `QueueSectionTreeItem`
**Type**: TreeItem
**Lifecycle**: Transient (created on-demand)

```typescript
// src/views/tree/QueueSectionTreeItem.ts

import * as vscode from 'vscode';

export class QueueSectionTreeItem extends vscode.TreeItem {
  constructor(public readonly section: string, public readonly label: string, public readonly count: number) {
    super(`${label} (${count})`, count > 0 ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed);

    this.contextValue = 'queueSection';
    this.tooltip = this.getTooltip();
    this.description = this.getDescription();
  }

  private getTooltip(): string {
    const descriptions: Record<string, string> = {
      pending: 'Content awaiting review',
      approved: 'Content approved, ready for scheduling',
      scheduled: 'Content scheduled for publishing',
      published: 'Successfully published content',
      rejected: 'Rejected content (archived)',
    };
    return descriptions[this.section] || '';
  }

  private getDescription(): string {
    if (this.count === 0) {
      return 'empty';
    }
    return '';
  }
}
```

#### 2.3 QueueItemTreeItem

**Component**: `QueueItemTreeItem`
**Type**: TreeItem
**Lifecycle**: Transient

```typescript
// src/views/tree/QueueItemTreeItem.ts

import * as vscode from 'vscode';
import { QueueItem } from '../../models/QueueItem';

export class QueueItemTreeItem extends vscode.TreeItem {
  constructor(public readonly item: QueueItem) {
    super(item.title, vscode.TreeItemCollapsibleState.None);

    this.contextValue = this.getContextValue();
    this.tooltip = this.getTooltip();
    this.description = this.getDescription();
    this.iconPath = this.getIcon();

    // Make item clickable
    this.command = {
      command: 'contentQueue.openItem',
      title: 'Open Content',
      arguments: [this.item],
    };
  }

  private getContextValue(): string {
    return `queueItem:${this.item.status}:${this.item.platform}`;
  }

  private getTooltip(): vscode.MarkdownString {
    const tooltip = new vscode.MarkdownString();
    tooltip.appendMarkdown(`**${this.item.title}**\n\n`);
    tooltip.appendMarkdown(`Platform: ${this.item.platform}\n\n`);
    tooltip.appendMarkdown(`Created: ${this.formatDate(this.item.createdAt)}\n\n`);

    if (this.item.scheduledAt) {
      tooltip.appendMarkdown(`Scheduled: ${this.formatDate(this.item.scheduledAt)}\n\n`);
    }

    tooltip.appendMarkdown(`Confidence: ${this.getConfidenceStars(this.item.confidence)}\n\n`);
    tooltip.appendMarkdown(`---\n\n`);
    tooltip.appendMarkdown(`Click to preview`);

    return tooltip;
  }

  private getDescription(): string {
    const parts: string[] = [];

    if (this.item.scheduledAt) {
      parts.push(this.formatRelativeTime(this.item.scheduledAt));
    } else {
      parts.push(this.formatRelativeTime(this.item.createdAt));
    }

    return parts.join(' • ');
  }

  private getIcon(): vscode.ThemeIcon {
    const platformIcons: Record<string, string> = {
      twitter: 'twitter',
      devto: 'note',
      linkedin: 'briefcase',
    };

    return new vscode.ThemeIcon(platformIcons[this.item.platform] || 'file');
  }

  private getConfidenceStars(confidence: number): string {
    if (confidence >= 80) return '⭐⭐⭐';
    if (confidence >= 50) return '⭐⭐';
    return '⭐';
  }

  private formatDate(date: Date): string {
    return date.toLocaleString();
  }

  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'just now';
  }
}
```

---

### 3. Webview Components

#### 3.1 ContentPreviewWebview

**Component**: `ContentPreviewWebview`
**Type**: Webview Panel
**Lifecycle**: Created on-demand, disposed on close

**Responsibilities**:

- Display content preview with rich formatting
- Show metadata (platform, confidence, source)
- Provide action buttons (approve, edit, reject, regenerate)
- Handle user interactions
- Support multiple variants (tabs or dropdown)

**TypeScript Implementation**:

```typescript
// src/views/webview/ContentPreviewWebview.ts

import * as vscode from 'vscode';
import { QueueItem } from '../../models/QueueItem';
import { GeneratedContent } from '../../models/GeneratedContent';

export class ContentPreviewWebview {
  private panel: vscode.WebviewPanel | undefined;

  constructor(
    private context: vscode.ExtensionContext,
    private onApprove: (item: QueueItem) => void,
    private onReject: (item: QueueItem) => void,
    private onEdit: (item: QueueItem) => void,
    private onRegenerate: (item: QueueItem) => void
  ) {}

  public show(item: QueueItem, content: GeneratedContent[]): void {
    if (this.panel) {
      this.panel.reveal();
    } else {
      this.panel = vscode.window.createWebviewPanel('contentPreview', `Preview: ${item.title}`, vscode.ViewColumn.Two, {
        enableScripts: true,
        retainContextWhenHidden: true,
      });

      this.panel.onDidDispose(() => {
        this.panel = undefined;
      });

      // Handle messages from webview
      this.panel.webview.onDidReceiveMessage((message) => this.handleMessage(message, item), undefined, this.context.subscriptions);
    }

    this.panel.webview.html = this.getWebviewContent(item, content);
  }

  private handleMessage(message: any, item: QueueItem): void {
    switch (message.command) {
      case 'approve':
        this.onApprove(item);
        break;
      case 'reject':
        this.onReject(item);
        break;
      case 'edit':
        this.onEdit(item);
        break;
      case 'regenerate':
        this.onRegenerate(item);
        break;
    }
  }

  private getWebviewContent(item: QueueItem, content: GeneratedContent[]): string {
    const nonce = this.getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <title>Content Preview</title>
  <style>
    body {
      padding: 20px;
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
    }
    .header {
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    .title {
      font-size: 1.5em;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .metadata {
      display: flex;
      gap: 15px;
      font-size: 0.9em;
      color: var(--vscode-descriptionForeground);
    }
    .metadata-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .content-tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    .tab {
      padding: 10px 15px;
      cursor: pointer;
      border-bottom: 2px solid transparent;
    }
    .tab.active {
      border-bottom-color: var(--vscode-focusBorder);
    }
    .content-area {
      padding: 20px;
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      margin-bottom: 20px;
      white-space: pre-wrap;
      font-family: var(--vscode-editor-font-family);
      line-height: 1.6;
    }
    .actions {
      display: flex;
      gap: 10px;
    }
    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    .btn-primary {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    .btn-primary:hover {
      background: var(--vscode-button-hoverBackground);
    }
    .btn-secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    .btn-danger {
      background: #e53935;
      color: white;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">${this.escapeHtml(item.title)}</div>
    <div class="metadata">
      <div class="metadata-item">
        <span>📱</span>
        <span>${item.platform}</span>
      </div>
      <div class="metadata-item">
        <span>📅</span>
        <span>${new Date(item.createdAt).toLocaleString()}</span>
      </div>
      <div class="metadata-item">
        <span>⭐</span>
        <span>Confidence: ${item.confidence}%</span>
      </div>
    </div>
  </div>
  
  <div class="content-tabs">
    ${content
      .map(
        (c, i) => `
      <div class="tab ${i === 0 ? 'active' : ''}" onclick="showVariant(${i})">
        Variant ${i + 1}
      </div>
    `
      )
      .join('')}
  </div>
  
  ${content
    .map(
      (c, i) => `
    <div class="content-area" id="content-${i}" style="display: ${i === 0 ? 'block' : 'none'}">
      ${this.formatContent(c.body, item.platform)}
    </div>
  `
    )
    .join('')}
  
  <div class="actions">
    <button class="btn btn-primary" onclick="sendCommand('approve')">
      ✅ Approve
    </button>
    <button class="btn btn-secondary" onclick="sendCommand('edit')">
      ✏️ Edit
    </button>
    <button class="btn btn-secondary" onclick="sendCommand('regenerate')">
      🔄 Regenerate
    </button>
    <button class="btn btn-danger" onclick="sendCommand('reject')">
      ❌ Reject
    </button>
  </div>
  
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    
    function sendCommand(command) {
      vscode.postMessage({ command });
    }
    
    function showVariant(index) {
      document.querySelectorAll('.content-area').forEach((el, i) => {
        el.style.display = i === index ? 'block' : 'none';
      });
      document.querySelectorAll('.tab').forEach((el, i) => {
        el.classList.toggle('active', i === index);
      });
    }
  </script>
</body>
</html>`;
  }

  private formatContent(content: string, platform: string): string {
    if (platform === 'twitter') {
      // Format Twitter threads
      return content
        .split('\n\n')
        .map(
          (tweet, i) =>
            `<div style="margin-bottom: 15px; padding: 10px; border-left: 3px solid var(--vscode-focusBorder);">
          <strong>Tweet ${i + 1}:</strong><br>${this.escapeHtml(tweet)}
        </div>`
        )
        .join('');
    }

    // Format markdown content
    return content
      .split('\n')
      .map((line) => this.escapeHtml(line))
      .join('<br>');
  }

  private escapeHtml(text: string): string {
    return text.replace(/[&<>"']/g, (char) => {
      const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      };
      return entities[char] || char;
    });
  }

  private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
```

#### 3.2 SchedulingDialogWebview

**Component**: `SchedulingDialogWebview`
**Type**: Webview Panel (Modal-like)
**Lifecycle**: Created on approval, disposed on schedule/cancel

```typescript
// src/views/webview/SchedulingDialogWebview.ts

export class SchedulingDialogWebview {
  public async show(item: QueueItem): Promise<SchedulingResult | undefined> {
    const panel = vscode.window.createWebviewPanel('schedulingDialog', 'Schedule Content', vscode.ViewColumn.Active, {
      enableScripts: true,
    });

    return new Promise((resolve) => {
      panel.webview.html = this.getDialogContent(item);

      panel.webview.onDidReceiveMessage((message) => {
        if (message.command === 'schedule') {
          resolve({
            scheduledAt: new Date(message.scheduledAt),
            timezone: message.timezone,
          });
          panel.dispose();
        } else if (message.command === 'cancel') {
          resolve(undefined);
          panel.dispose();
        }
      });

      panel.onDidDispose(() => {
        resolve(undefined);
      });
    });
  }

  private getDialogContent(item: QueueItem): string {
    const optimalTimes = this.calculateOptimalTimes(item.platform);

    return `<!DOCTYPE html>
<html>
<head>
  <style>
    /* Similar styling as preview webview */
    .dialog-content {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .time-options {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin: 20px 0;
    }
    .time-option {
      padding: 15px;
      border: 2px solid var(--vscode-input-border);
      border-radius: 4px;
      cursor: pointer;
    }
    .time-option.recommended {
      border-color: var(--vscode-focusBorder);
      background: var(--vscode-list-hoverBackground);
    }
  </style>
</head>
<body>
  <div class="dialog-content">
    <h2>Schedule Content</h2>
    <p>When should we publish this content?</p>
    
    <div class="time-options">
      <label class="time-option recommended">
        <input type="radio" name="time" value="${optimalTimes[0]}" checked>
        <strong>🎯 ${this.formatTime(optimalTimes[0])}</strong>
        <span> - Best time</span>
      </label>
      <label class="time-option">
        <input type="radio" name="time" value="${optimalTimes[1]}">
        <strong>${this.formatTime(optimalTimes[1])}</strong>
        <span> - Good time</span>
      </label>
      <label class="time-option">
        <input type="radio" name="time" value="${optimalTimes[2]}">
        <strong>${this.formatTime(optimalTimes[2])}</strong>
        <span> - Good time</span>
      </label>
      <label class="time-option">
        <input type="radio" name="time" value="custom">
        <strong>Custom time</strong>
        <input type="datetime-local" id="custom-time" style="margin-left: 10px;">
      </label>
    </div>
    
    <div class="actions">
      <button class="btn btn-primary" onclick="schedule()">
        Schedule
      </button>
      <button class="btn btn-secondary" onclick="cancel()">
        Cancel
      </button>
    </div>
  </div>
  
  <script>
    const vscode = acquireVsCodeApi();
    
    function schedule() {
      const selectedTime = document.querySelector('input[name="time"]:checked').value;
      const scheduledAt = selectedTime === 'custom' 
        ? document.getElementById('custom-time').value
        : selectedTime;
      
      vscode.postMessage({
        command: 'schedule',
        scheduledAt,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    }
    
    function cancel() {
      vscode.postMessage({ command: 'cancel' });
    }
  </script>
</body>
</html>`;
  }

  private calculateOptimalTimes(platform: string): Date[] {
    const now = new Date();
    const times: Date[] = [];

    if (platform === 'twitter') {
      // Twitter optimal: 8-10am, 12-1pm, 5-6pm EST
      times.push(this.getNextOccurrence(now, 9, 0)); // 9am
      times.push(this.getNextOccurrence(now, 12, 30)); // 12:30pm
      times.push(this.getNextOccurrence(now, 17, 0)); // 5pm
    } else if (platform === 'devto') {
      // Dev.to optimal: 9-11am EST, weekdays
      times.push(this.getNextWeekday(now, 9, 0));
      times.push(this.getNextWeekday(now, 10, 0));
      times.push(this.getNextWeekday(now, 11, 0));
    }

    return times;
  }

  private getNextOccurrence(from: Date, hour: number, minute: number): Date {
    const next = new Date(from);
    next.setHours(hour, minute, 0, 0);
    if (next <= from) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  }

  private getNextWeekday(from: Date, hour: number, minute: number): Date {
    let next = new Date(from);
    next.setHours(hour, minute, 0, 0);

    // Skip to next occurrence
    if (next <= from) {
      next.setDate(next.getDate() + 1);
    }

    // Skip weekends
    while (next.getDay() === 0 || next.getDay() === 6) {
      next.setDate(next.getDate() + 1);
    }

    return next;
  }

  private formatTime(date: Date): string {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}

interface SchedulingResult {
  scheduledAt: Date;
  timezone: string;
}
```

---

### 4. Status Bar Component

**Component**: `StatusBarController`
**Type**: Status Bar Item
**Lifecycle**: Singleton (created on activation)

```typescript
// src/views/statusbar/StatusBarController.ts

import * as vscode from 'vscode';
import { QueueStateManager } from '../../state/QueueStateManager';

export class StatusBarController {
  private statusBarItem: vscode.StatusBarItem;

  constructor(private queueStateManager: QueueStateManager) {
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);

    this.statusBarItem.command = 'contentQueue.openQueue';
    this.statusBarItem.show();

    // Update when queue changes
    this.queueStateManager.onQueueUpdated(() => {
      this.update();
    });
  }

  public async update(): Promise<void> {
    const counts = await this.queueStateManager.getQueueCounts();
    const pendingCount = counts.pending;

    if (pendingCount > 0) {
      this.statusBarItem.text = `$(list-unordered) Content Queue (${pendingCount})`;
      this.statusBarItem.tooltip = `${pendingCount} content item(s) pending review. Click to open queue.`;
      this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    } else {
      this.statusBarItem.text = `$(check) Content Queue`;
      this.statusBarItem.tooltip = 'Content queue empty. All content processed!';
      this.statusBarItem.backgroundColor = undefined;
    }
  }

  public dispose(): void {
    this.statusBarItem.dispose();
  }
}
```

---

### 5. Command Service

**Component**: `CommandService`
**Type**: Service
**Lifecycle**: Singleton

**Responsibilities**:

- Register all extension commands
- Handle command execution
- Coordinate between UI and services

```typescript
// src/services/CommandService.ts

import * as vscode from 'vscode';
import { QueueStateManager } from '../state/QueueStateManager';
import { ContentQueueTreeView } from '../views/tree/ContentQueueTreeView';
import { NotificationService } from './NotificationService';

export class CommandService {
  constructor(
    private context: vscode.ExtensionContext,
    private queueStateManager: QueueStateManager,
    private treeView: ContentQueueTreeView,
    private notificationService: NotificationService
  ) {}

  public registerAllCommands(): void {
    this.registerCommand('contentQueue.openQueue', () => this.openQueue());
    this.registerCommand('contentQueue.refresh', () => this.refresh());
    this.registerCommand('contentQueue.setup', () => this.setup());
    this.registerCommand('contentQueue.openItem', (item) => this.openItem(item));
    this.registerCommand('contentQueue.approveItem', (item) => this.approveItem(item));
    this.registerCommand('contentQueue.rejectItem', (item) => this.rejectItem(item));
    this.registerCommand('contentQueue.editItem', (item) => this.editItem(item));
    this.registerCommand('contentQueue.regenerateItem', (item) => this.regenerateItem(item));
    this.registerCommand('contentQueue.scheduleItem', (item) => this.scheduleItem(item));
    this.registerCommand('contentQueue.bulkApprove', () => this.bulkApprove());
    this.registerCommand('contentQueue.createOpportunity', () => this.createOpportunity());
    this.registerCommand('contentQueue.connectPlatform', (platform) => this.connectPlatform(platform));
    this.registerCommand('contentQueue.showAnalytics', () => this.showAnalytics());
  }

  private registerCommand(command: string, handler: (...args: any[]) => any): void {
    this.context.subscriptions.push(vscode.commands.registerCommand(command, handler));
  }

  private async openQueue(): Promise<void> {
    await vscode.commands.executeCommand('contentQueue.focus');
  }

  private async refresh(): Promise<void> {
    await this.queueStateManager.refresh();
    this.treeView.refresh();
    this.notificationService.showInfo('Content queue refreshed');
  }

  private async setup(): Promise<void> {
    // Show setup wizard
    const setupWebview = new SetupWizardWebview(this.context);
    await setupWebview.show();
  }

  private async openItem(item: QueueItem): Promise<void> {
    const content = await this.queueStateManager.getGeneratedContent(item.id);
    const previewWebview = new ContentPreviewWebview(
      this.context,
      (item) => this.approveItem(item),
      (item) => this.rejectItem(item),
      (item) => this.editItem(item),
      (item) => this.regenerateItem(item)
    );
    previewWebview.show(item, content);
  }

  private async approveItem(item: QueueItem): Promise<void> {
    // Show scheduling dialog
    const schedulingDialog = new SchedulingDialogWebview();
    const result = await schedulingDialog.show(item);

    if (result) {
      await this.queueStateManager.scheduleContent(item.id, result.scheduledAt);
      this.notificationService.showSuccess(`Content scheduled for ${result.scheduledAt.toLocaleString()}`);
      this.treeView.refresh();
    }
  }

  private async rejectItem(item: QueueItem): Promise<void> {
    const confirmed = await vscode.window.showWarningMessage(`Reject "${item.title}"?`, { modal: true }, 'Yes, Reject');

    if (confirmed) {
      await this.queueStateManager.rejectContent(item.id);
      this.notificationService.showInfo('Content rejected');
      this.treeView.refresh();
    }
  }

  private async editItem(item: QueueItem): Promise<void> {
    const contentPath = await this.queueStateManager.getContentPath(item.id);
    const document = await vscode.workspace.openTextDocument(contentPath);
    await vscode.window.showTextDocument(document);
  }

  private async regenerateItem(item: QueueItem): Promise<void> {
    const confirmed = await vscode.window.showInformationMessage('Regenerate content with different AI prompt?', 'Yes, Regenerate', 'Cancel');

    if (confirmed === 'Yes, Regenerate') {
      await this.queueStateManager.regenerateContent(item.id);
      this.notificationService.showInfo('Content regeneration started...');
    }
  }

  // ... more command handlers
}
```

---

## State Management Architecture

### QueueStateManager

**Pattern**: Observer/Subject
**Responsibilities**: Central state management for content queue

```typescript
// src/state/QueueStateManager.ts

import { EventEmitter } from 'events';
import { FileSystemService } from '../services/FileSystemService';

export class QueueStateManager extends EventEmitter {
  private cache = new Map<string, QueueItem>();

  constructor(private fileSystemService: FileSystemService) {
    super();
  }

  public async getQueueCounts(): Promise<QueueCounts> {
    const items = await this.getAllItems();

    return {
      pending: items.filter((i) => i.status === 'pending').length,
      approved: items.filter((i) => i.status === 'approved').length,
      scheduled: items.filter((i) => i.status === 'scheduled').length,
      published: items.filter((i) => i.status === 'published').length,
      rejected: items.filter((i) => i.status === 'rejected').length,
    };
  }

  public async getQueueItems(status: string): Promise<QueueItem[]> {
    const items = await this.getAllItems();
    return items.filter((i) => i.status === status);
  }

  public onQueueUpdated(callback: () => void): void {
    this.on('queueUpdated', callback);
  }

  private notifyQueueUpdated(): void {
    this.emit('queueUpdated');
  }

  // ... more methods
}
```

---

## Component Interaction Flow

```
User Action (TreeView Click)
    ↓
CommandService.openItem(item)
    ↓
QueueStateManager.getGeneratedContent(item.id)
    ↓
FileSystemService.readContentFiles(path)
    ↓
ContentPreviewWebview.show(item, content)
    ↓
User Clicks [Approve]
    ↓
Webview sends message 'approve'
    ↓
CommandService.approveItem(item)
    ↓
SchedulingDialogWebview.show(item)
    ↓
User Selects Time
    ↓
QueueStateManager.scheduleContent(item.id, time)
    ↓
FileSystemService.moveToScheduled(item.id)
    ↓
QueueStateManager.notifyQueueUpdated()
    ↓
TreeDataProvider.refresh()
    ↓
TreeView Updates (item moved to "Scheduled")
```

---

## UI Component Validation Checklist

**MVP UI Complete When**:

- [ ] TreeView displays all queue sections
- [ ] Items clickable and show context menus
- [ ] Preview webview shows content with variants
- [ ] Scheduling dialog shows optimal times
- [ ] Status bar updates with queue count
- [ ] All commands registered and functional
- [ ] Keyboard shortcuts work (Cmd+Shift+Q)
- [ ] Error states handled gracefully
- [ ] Loading states shown for async operations
- [ ] Accessibility: keyboard navigation works
- [ ] Theming: respects VS Code light/dark themes

**Quality Gates**:

- ✓ All UI follows VS Code extension guidelines
- ✓ No blocking operations (all async)
- ✓ Graceful error handling with user feedback
- ✓ Performance targets met (< 500ms load time)

---

**Next Steps**: Review database-schema.specification.md for data models and api-specifications.specification.md for API contracts.
