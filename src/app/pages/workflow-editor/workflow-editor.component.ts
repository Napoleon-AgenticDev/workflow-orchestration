import { Component, OnInit, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Workflow, WorkflowNode, WorkflowEdge } from '@alchemy-flow/shared';

interface Point { x: number; y: number }

@Component({
  selector: 'app-workflow-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="editor">
      <header class="editor-header">
        <div class="left">
          <a routerLink="/workflows" class="back">← Back</a>
          <input class="title-input" [(ngModel)]="workflow()!.name" (blur)="save()" placeholder="Workflow name">
          <span class="badge" [class]="workflow()?.metadata?.status || 'draft'">{{ workflow()?.metadata?.status || 'draft' }}</span>
        </div>
        <div class="right">
          <button class="btn-secondary" (click)="save()">Save</button>
          <button class="btn-primary" (click)="execute()">▶ Run</button>
        </div>
      </header>

      <div class="toolbar">
        <div class="node-palette">
          @for (nodeType of nodeTypes; track nodeType.type) {
            <button class="node-btn" [class]="nodeType.type" (click)="addNode(nodeType.type)">
              <span class="node-icon">{{ nodeType.icon }}</span>
              <span>{{ nodeType.label }}</span>
            </button>
          }
        </div>
        <div class="toolbar-actions">
          <button class="tool-btn" (click)="zoomIn()">+</button>
          <button class="tool-btn" (click)="zoomOut()">−</button>
          <button class="tool-btn" (click)="fitView()">⊡</button>
        </div>
      </div>

      <div class="canvas-wrapper" (mousedown)="startPan($event)" (wheel)="onWheel($event)">
        <div class="canvas" [style.transform]="getCanvasTransform()">
          
          <!-- Edges SVG Layer -->
          <svg class="edges-layer" [attr.width]="canvasWidth" [attr.height]="canvasHeight">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
              </marker>
            </defs>
            
            <!-- Existing edges -->
            @for (edge of edges(); track edge.id) {
              <path [attr.d]="getEdgePath(edge)" 
                    class="edge" 
                    [class.selected]="selectedEdge()?.id === edge.id"
                    (click)="selectEdge(edge, $event)" />
            }
            
            <!-- Active connection being drawn -->
            @if (connectionStart()) {
              <path [attr.d]="getTempEdgePath()" class="edge temp" />
            }
          </svg>

          <!-- Nodes Layer -->
          @for (node of nodes(); track node.id) {
            <div class="node" 
                 [class.selected]="selectedNode()?.id === node.id"
                 [class]="node.type"
                 [style.left.px]="node.positionX"
                 [style.top.px]="node.positionY"
                 (mousedown)="startDragNode(node, $event)">
              
              <!-- Input handle -->
              <div class="handle input" 
                   (mousedown)="startConnection(node, 'input', $event)"
                   (mouseup)="endConnection(node, 'input', $event)">
              </div>
              
              <div class="node-header">
                <span class="node-icon">{{ getNodeIcon(node.type) }}</span>
                <span class="node-type">{{ node.type }}</span>
              </div>
              <div class="node-label">{{ node.data['name'] || node.data['skill'] || node.data['agent'] || node.data['action'] || getDefaultLabel(node) }}</div>
              
              <!-- Output handle -->
              <div class="handle output" 
                   (mousedown)="startConnection(node, 'output', $event)"
                   (mouseup)="endConnection(node, 'output', $event)">
              </div>

              <button class="delete-node" (click)="deleteNode(node.id, $event)">×</button>
            </div>
          }
        </div>
      </div>

      @if (selectedNode()) {
        <div class="properties-panel">
          <div class="panel-header">
            <h3>{{ selectedNode()!.type | titlecase }} Node</h3>
            <button class="close-panel" (click)="deselectNode()">×</button>
          </div>
          
          <div class="form-group">
            <label>Name</label>
            <input [(ngModel)]="selectedNode()!.data['name']" placeholder="Node name" (blur)="saveNodes()">
          </div>
          
          @switch (selectedNode()!.type) {
            @case ('skill') {
              <div class="form-group">
                <label>Skill</label>
                <select [(ngModel)]="selectedNode()!.data['skill']" (change)="saveNodes()">
                  <option value="">Select skill...</option>
                  <option value="marketing-engine">marketing-engine</option>
                  <option value="elevenlabs">elevenlabs</option>
                  <option value="elevenlabs-video-generator">elevenlabs-video-generator</option>
                  <option value="memory">memory</option>
                </select>
              </div>
              <div class="form-group">
                <label>Action</label>
                <input [(ngModel)]="selectedNode()!.data['action']" placeholder="e.g., research, create-content" (blur)="saveNodes()">
              </div>
              <div class="form-group">
                <label>Parameters (JSON)</label>
                <textarea [(ngModel)]="selectedNode()!.data['params']" placeholder='{"key": "value"}' (blur)="saveNodes()"></textarea>
              </div>
            }
            @case ('agent') {
              <div class="form-group">
                <label>Agent</label>
                <select [(ngModel)]="selectedNode()!.data['agent']" (change)="saveNodes()">
                  <option value="">Select agent...</option>
                  <option value="opencode-controller">opencode-controller</option>
                  <option value="marketing-engine">marketing-engine</option>
                  <option value="explore">explore</option>
                </select>
              </div>
              <div class="form-group">
                <label>Instructions</label>
                <textarea [(ngModel)]="selectedNode()!.data['instructions']" placeholder="Agent instructions..." (blur)="saveNodes()"></textarea>
              </div>
            }
            @case ('api') {
              <div class="form-group">
                <label>Method</label>
                <select [(ngModel)]="selectedNode()!.data['method']" (change)="saveNodes()">
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              <div class="form-group">
                <label>URL</label>
                <input [(ngModel)]="selectedNode()!.data['url']" placeholder="https://api.example.com/endpoint" (blur)="saveNodes()">
              </div>
              <div class="form-group">
                <label>Headers (JSON)</label>
                <textarea [(ngModel)]="selectedNode()!.data['headers']" placeholder='{"Authorization": "Bearer ..."}' (blur)="saveNodes()"></textarea>
              </div>
              <div class="form-group">
                <label>Body (JSON)</label>
                <textarea [(ngModel)]="selectedNode()!.data['body']" placeholder='{}' (blur)="saveNodes()"></textarea>
              </div>
            }
            @case ('condition') {
              <div class="form-group">
                <label>Condition Type</label>
                <select [(ngModel)]="selectedNode()!.data['conditionType']" (change)="saveNodes()">
                  <option value="if">If/Else</option>
                  <option value="switch">Switch</option>
                </select>
              </div>
              <div class="form-group">
                <label>Expression</label>
                <input [(ngModel)]="selectedNode()!.data['expression']" placeholder="data.status === 'success'" (blur)="saveNodes()">
              </div>
              <div class="form-group">
                <label>True Label</label>
                <input [(ngModel)]="selectedNode()!.data['trueLabel']" placeholder="Yes" (blur)="saveNodes()">
              </div>
              <div class="form-group">
                <label>False Label</label>
                <input [(ngModel)]="selectedNode()!.data['falseLabel']" placeholder="No" (blur)="saveNodes()">
              </div>
            }
            @case ('delay') {
              <div class="form-group">
                <label>Duration</label>
                <input [(ngModel)]="selectedNode()!.data['duration']" placeholder="1000" type="number">
              </div>
              <div class="form-group">
                <label>Unit</label>
                <select [(ngModel)]="selectedNode()!.data['unit']" (change)="saveNodes()">
                  <option value="ms">Milliseconds</option>
                  <option value="s">Seconds</option>
                  <option value="m">Minutes</option>
                  <option value="h">Hours</option>
                </select>
              </div>
            }
            @case ('transform') {
              <div class="form-group">
                <label>Transform Type</label>
                <select [(ngModel)]="selectedNode()!.data['transformType']" (change)="saveNodes()">
                  <option value="map">Map</option>
                  <option value="filter">Filter</option>
                  <option value="merge">Merge</option>
                  <option value="script">Custom Script</option>
                </select>
              </div>
              <div class="form-group">
                <label>Mapping (JSON)</label>
                <textarea [(ngModel)]="selectedNode()!.data['mapping']" placeholder='{"output": "input.field"}' (blur)="saveNodes()"></textarea>
              </div>
            }
          }

          <div class="panel-footer">
            <button class="btn-danger" (click)="deleteNode(selectedNode()!.id, $event)">Delete Node</button>
          </div>
        </div>
      }

      <!-- Trigger Config Panel -->
      <div class="trigger-panel">
        <h4>Trigger</h4>
        <div class="trigger-config">
          <select [(ngModel)]="workflow()!.trigger.type" (change)="save()">
            <option value="manual">Manual</option>
            <option value="cron">Cron Schedule</option>
            <option value="webhook">Webhook</option>
            <option value="event">Event</option>
          </select>
          @if (workflow()!.trigger.type === 'cron') {
            <input [(ngModel)]="workflow()!.trigger.config['cron']" placeholder="0 8 * * *" (blur)="save()">
          }
          @if (workflow()!.trigger.type === 'webhook') {
            <input [(ngModel)]="workflow()!.trigger.config['path']" placeholder="/webhook/path" (blur)="save()">
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .editor { display: flex; flex-direction: column; height: 100vh; background: #0f172a; color: #e2e8f0; }
    .editor-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; background: #1e293b; border-bottom: 1px solid #334155; }
    .left { display: flex; align-items: center; gap: 1rem; }
    .back { color: #94a3b8; text-decoration: none; font-size: 0.9rem; }
    .back:hover { color: #e2e8f0; }
    .title-input { background: transparent; border: 1px solid transparent; color: #f8fafc; font-size: 1.1rem; font-weight: 600; padding: 0.4rem 0.75rem; border-radius: 6px; }
    .title-input:focus { background: #334155; border-color: #475569; outline: none; }
    .right { display: flex; gap: 0.75rem; }
    .btn-primary { background: #6366f1; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 500; }
    .btn-primary:hover { background: #4f46e5; }
    .btn-secondary { background: #334155; color: #e2e8f0; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
    .btn-secondary:hover { background: #475569; }
    .btn-danger { background: #dc2626; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; width: 100%; }
    .badge { padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; }
    .badge.draft { background: #475569; color: #94a3b8; }
    .badge.active { background: #059669; color: #d1fae5; }
    
    .toolbar { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1.5rem; background: #1e293b; border-bottom: 1px solid #334155; }
    .node-palette { display: flex; gap: 0.5rem; }
    .node-btn { display: flex; align-items: center; gap: 0.4rem; background: #334155; border: 1px solid #475569; color: #e2e8f0; padding: 0.4rem 0.75rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem; transition: all 0.15s; }
    .node-btn:hover { background: #475569; transform: translateY(-1px); }
    .node-btn .node-icon { font-size: 1rem; }
    .node-btn.skill { border-left: 3px solid #a855f7; }
    .node-btn.agent { border-left: 3px solid #10b981; }
    .node-btn.api { border-left: 3px solid #f59e0b; }
    .node-btn.condition { border-left: 3px solid #ec4899; }
    .node-btn.delay { border-left: 3px solid #3b82f6; }
    .node-btn.transform { border-left: 3px solid #14b8a6; }
    .toolbar-actions { display: flex; gap: 0.25rem; }
    .tool-btn { background: #334155; border: 1px solid #475569; color: #e2e8f0; width: 28px; height: 28px; border-radius: 4px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; }

    .canvas-wrapper { flex: 1; overflow: hidden; position: relative; cursor: grab; }
    .canvas-wrapper:active { cursor: grabbing; }
    .canvas { position: absolute; transform-origin: 0 0; background: #0f172a; 
      background-image: radial-gradient(circle, #334155 1px, transparent 1px); 
      background-size: 24px 24px; min-width: 3000px; min-height: 2000px; }
    
    .edges-layer { position: absolute; top: 0; left: 0; overflow: visible; }
    .edge { fill: none; stroke: #64748b; stroke-width: 2; cursor: pointer; transition: stroke 0.15s; }
    .edge:hover { stroke: #94a3b8; }
    .edge.selected { stroke: #6366f1; stroke-width: 2.5; }
    .edge.temp { stroke-dasharray: 5,5; stroke: #6366f1; opacity: 0.7; }

    .node { position: absolute; background: #1e293b; border: 2px solid #334155; border-radius: 10px; min-width: 140px; cursor: move; box-shadow: 0 4px 12px rgba(0,0,0,0.4); transition: border-color 0.15s, box-shadow 0.15s; }
    .node:hover { border-color: #475569; }
    .node.selected { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.3); }
    .node.skill { border-top: 3px solid #a855f7; }
    .node.agent { border-top: 3px solid #10b981; }
    .node.api { border-top: 3px solid #f59e0b; }
    .node.condition { border-top: 3px solid #ec4899; }
    .node.delay { border-top: 3px solid #3b82f6; }
    .node.transform { border-top: 3px solid #14b8a6; }

    .handle { position: absolute; width: 12px; height: 12px; background: #64748b; border: 2px solid #1e293b; border-radius: 50%; cursor: crosshair; transition: background 0.15s, transform 0.15s; z-index: 10; }
    .handle:hover { background: #6366f1; transform: scale(1.3); }
    .handle.input { left: -6px; top: 50%; transform: translateY(-50%); }
    .handle.input:hover { transform: translateY(-50%) scale(1.3); }
    .handle.output { right: -6px; top: 50%; transform: translateY(-50%); }
    .handle.output:hover { transform: translateY(-50%) scale(1.3); }

    .node-header { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 0.75rem 0.4rem; border-bottom: 1px solid #334155; }
    .node-icon { font-size: 1rem; }
    .node-type { font-size: 0.65rem; text-transform: uppercase; color: #94a3b8; font-weight: 600; letter-spacing: 0.5px; }
    .node-label { padding: 0.5rem 0.75rem 0.75rem; font-size: 0.8rem; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; }
    .delete-node { position: absolute; top: -8px; right: -8px; background: #dc2626; color: white; border: none; width: 18px; height: 18px; border-radius: 50%; cursor: pointer; font-size: 12px; line-height: 1; display: none; }
    .node:hover .delete-node { display: block; }

    .properties-panel { position: fixed; right: 1rem; top: 120px; width: 320px; max-height: calc(100vh - 180px); background: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow-y: auto; box-shadow: 0 8px 30px rgba(0,0,0,0.5); }
    .panel-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #334155; }
    .panel-header h3 { margin: 0; color: #f8fafc; font-size: 1rem; }
    .close-panel { background: transparent; border: none; color: #94a3b8; font-size: 1.25rem; cursor: pointer; }
    .form-group { padding: 0.75rem 1rem; border-bottom: 1px solid #334155; }
    .form-group:last-of-type { border-bottom: none; }
    .form-group label { display: block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 0.4rem; font-weight: 500; }
    .form-group input, .form-group select, .form-group textarea { width: 100%; background: #0f172a; border: 1px solid #334155; color: #e2e8f0; padding: 0.5rem; border-radius: 6px; font-size: 0.85rem; }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #6366f1; }
    .form-group textarea { min-height: 80px; font-family: monospace; }
    .panel-footer { padding: 1rem; border-top: 1px solid #334155; }

    .trigger-panel { position: fixed; left: 1rem; bottom: 1rem; background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 1rem; width: 280px; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
    .trigger-panel h4 { margin: 0 0 0.75rem; color: #e2e8f0; font-size: 0.9rem; }
    .trigger-config { display: flex; flex-direction: column; gap: 0.5rem; }
    .trigger-config input, .trigger-config select { background: #0f172a; border: 1px solid #334155; color: #e2e8f0; padding: 0.4rem; border-radius: 6px; font-size: 0.85rem; }
  `]
})
export class WorkflowEditorComponent implements OnInit {
  workflow = signal<Workflow | null>(null);
  nodes = signal<WorkflowNode[]>([]);
  edges = signal<WorkflowEdge[]>([]);
  selectedNode = signal<WorkflowNode | null>(null);
  selectedEdge = signal<WorkflowEdge | null>(null);

  zoom = signal(1);
  panX = signal(0);
  panY = signal(0);
  canvasWidth = 3000;
  canvasHeight = 2000;

  draggingNode: WorkflowNode | null = null;
  dragOffset = { x: 0, y: 0 };
  isPanning = false;
  panStart = { x: 0, y: 0 };

  connectionStart = signal<{ nodeId: string; handle: string; x: number; y: number } | null>(null);
  mousePos = { x: 0, y: 0 };

  nodeTypes = [
    { type: 'skill', label: 'Skill', icon: '⚡' },
    { type: 'agent', label: 'Agent', icon: '🤖' },
    { type: 'api', label: 'API', icon: '🌐' },
    { type: 'condition', label: 'Condition', icon: '🔀' },
    { type: 'delay', label: 'Delay', icon: '⏱' },
    { type: 'transform', label: 'Transform', icon: '🔄' },
  ];

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.api.getWorkflow(id).subscribe(wf => {
        this.workflow.set(wf);
        this.nodes.set(wf.nodes || []);
        this.edges.set(wf.edges || []);
      });
    }
  }

  getCanvasTransform() {
    return `scale(${this.zoom()}) translate(${this.panX()}px, ${this.panY()}px)`;
  }

  getNodeIcon(type: string): string {
    const icons: Record<string, string> = { skill: '⚡', agent: '🤖', api: '🌐', condition: '🔀', delay: '⏱', transform: '🔄' };
    return icons[type] || '●';
  }

  getDefaultLabel(node: WorkflowNode): string {
    switch (node.type) {
      case 'skill': return node.data['skill'] || 'Skill';
      case 'agent': return node.data['agent'] || 'Agent';
      case 'api': return node.data['method'] + ' ' + (node.data['url'] || 'API');
      case 'condition': return node.data['expression'] || 'Condition';
      case 'delay': return node.data['duration'] + 'ms';
      case 'transform': return node.data['transformType'] || 'Transform';
      default: return node.type;
    }
  }

  addNode(type: string) {
    const centerX = (window.innerWidth / 2 - this.panX()) / this.zoom();
    const centerY = (window.innerHeight / 2 - this.panY()) / this.zoom();
    const newNode: WorkflowNode = {
      id: crypto.randomUUID(),
      nodeId: `node_${Date.now()}`,
      type: type as any,
      positionX: centerX + Math.random() * 100 - 50,
      positionY: centerY + Math.random() * 100 - 50,
      data: { name: `New ${type}` }
    };
    this.nodes.update(nodes => [...nodes, newNode]);
    this.saveNodes();
  }

  startDragNode(node: WorkflowNode, event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('handle')) return;
    this.draggingNode = node;
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    this.dragOffset = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.draggingNode) {
      const x = (event.clientX - this.dragOffset.x) / this.zoom() - this.panX() / this.zoom();
      const y = (event.clientY - this.dragOffset.y) / this.zoom() - this.panY() / this.zoom();
      this.nodes.update(nodes => nodes.map(n => n.id === this.draggingNode!.id ? { ...n, positionX: x, positionY: y } : n));
    }
    if (this.isPanning) {
      this.panX.set(this.panX() + event.clientX - this.panStart.x);
      this.panY.set(this.panY() + event.clientY - this.panStart.y);
      this.panStart = { x: event.clientX, y: event.clientY };
    }
    const canvasRect = document.querySelector('.canvas')?.getBoundingClientRect();
    if (canvasRect) {
      this.mousePos = { x: (event.clientX - canvasRect.left) / this.zoom(), y: (event.clientY - canvasRect.top) / this.zoom() };
    }
  }

  @HostListener('window:mouseup')
  onMouseUp() {
    if (this.draggingNode) {
      this.draggingNode = null;
      this.saveNodes();
    }
    if (this.isPanning) {
      this.isPanning = false;
    }
    if (this.connectionStart()) {
      this.connectionStart.set(null);
    }
  }

  startPan(event: MouseEvent) {
    if ((event.target as HTMLElement).closest('.node')) return;
    this.isPanning = true;
    this.panStart = { x: event.clientX, y: event.clientY };
  }

  onWheel(event: WheelEvent) {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.3, Math.min(2, this.zoom() * delta));
    this.zoom.set(newZoom);
  }

  zoomIn() { this.zoom.set(Math.min(2, this.zoom() * 1.2)); }
  zoomOut() { this.zoom.set(Math.max(0.3, this.zoom() / 1.2)); }
  fitView() { this.zoom.set(1); this.panX.set(0); this.panY.set(0); }

  startConnection(node: WorkflowNode, handle: string, event: MouseEvent) {
    event.stopPropagation();
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const canvasRect = document.querySelector('.canvas')?.getBoundingClientRect();
    if (canvasRect) {
      const x = (rect.left + rect.width/2 - canvasRect.left) / this.zoom();
      const y = (rect.top + rect.height/2 - canvasRect.top) / this.zoom();
      this.connectionStart.set({ nodeId: node.id, handle, x, y });
    }
  }

  endConnection(node: WorkflowNode, handle: string, event: MouseEvent) {
    event.stopPropagation();
    const start = this.connectionStart();
    if (start && start.nodeId !== node.id && start.handle !== handle) {
      const newEdge: WorkflowEdge = {
        id: crypto.randomUUID(),
        edgeId: `edge_${Date.now()}`,
        source: start.handle === 'output' ? start.nodeId : node.id,
        target: start.handle === 'output' ? node.id : start.nodeId
      };
      this.edges.update(edges => [...edges, newEdge]);
      this.saveNodes();
    }
    this.connectionStart.set(null);
  }

  getEdgePath(edge: WorkflowEdge): string {
    const source = this.nodes().find(n => n.id === edge.source);
    const target = this.nodes().find(n => n.id === edge.target);
    if (!source || !target) return '';
    const sx = source.positionX + 140, sy = source.positionY + 40;
    const tx = target.positionX, ty = target.positionY + 40;
    const dx = Math.abs(tx - sx) / 2;
    return `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`;
  }

  getTempEdgePath(): string {
    const start = this.connectionStart();
    if (!start) return '';
    const dx = Math.abs(this.mousePos.x - start.x) / 2;
    return `M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${this.mousePos.x - dx} ${this.mousePos.y}, ${this.mousePos.x} ${this.mousePos.y}`;
  }

  selectNode(node: WorkflowNode, event: Event) {
    event.stopPropagation();
    this.selectedNode.set(node);
    this.selectedEdge.set(null);
  }

  selectEdge(edge: WorkflowEdge, event: Event) {
    event.stopPropagation();
    this.selectedEdge.set(edge);
    this.selectedNode.set(null);
  }

  deselectNode() {
    this.selectedNode.set(null);
    this.selectedEdge.set(null);
  }

  deleteNode(id: string, event: Event) {
    event.stopPropagation();
    this.nodes.update(nodes => nodes.filter(n => n.id !== id));
    this.edges.update(edges => edges.filter(e => e.source !== id && e.target !== id));
    if (this.selectedNode()?.id === id) this.selectedNode.set(null);
    this.saveNodes();
  }

  save() {
    const wf = this.workflow();
    if (wf) {
      this.api.updateWorkflow(wf.id, { name: wf.name, trigger: wf.trigger }).subscribe();
    }
  }

  saveNodes() {
    const wf = this.workflow();
    if (wf) {
      this.api.updateWorkflowNodes(wf.id, this.nodes(), this.edges()).subscribe();
    }
  }

  execute() {
    const wf = this.workflow();
    if (wf) {
      this.api.executeWorkflow(wf.id).subscribe();
    }
  }
}