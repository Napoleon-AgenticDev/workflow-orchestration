import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Workflow, WorkflowNode, WorkflowEdge } from '../../models/workflow.model';

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
        <button class="node-btn" (click)="addNode('skill')">+ Skill</button>
        <button class="node-btn" (click)="addNode('agent')">+ Agent</button>
        <button class="node-btn" (click)="addNode('api')">+ API</button>
        <button class="node-btn" (click)="addNode('condition')">+ Condition</button>
        <button class="node-btn" (click)="addNode('delay')">+ Delay</button>
        <button class="node-btn" (click)="addNode('transform')">+ Transform</button>
      </div>

      <div class="canvas-container">
        <div class="canvas" (click)="deselectNode()">
          @for (node of nodes(); track node.id) {
            <div class="node" 
                 [class.selected]="selectedNode()?.id === node.id"
                 [class]="node.type"
                 [style.left.px]="node.positionX"
                 [style.top.px]="node.positionY"
                 (click)="selectNode(node, $event)">
              <div class="node-icon">{{ getNodeIcon(node.type) }}</div>
              <div class="node-label">{{ node.data['skill'] || node.data['agent'] || node.data['action'] || node.type }}</div>
              <button class="delete-node" (click)="deleteNode(node.id, $event)">×</button>
            </div>
          }
          
          @for (edge of edges(); track edge.id) {
            <svg class="edges-layer">
              <line [attr.x1]="getNodeCenter(edge.source).x" [attr.y1]="getNodeCenter(edge.source).y"
                    [attr.x2]="getNodeCenter(edge.target).x" [attr.y2]="getNodeCenter(edge.target).y"
                    class="edge-line" />
            </svg>
          }
        </div>
      </div>

      @if (selectedNode()) {
        <div class="properties-panel">
          <h3>Node Properties</h3>
          <div class="form-group">
            <label>Type</label>
            <select [(ngModel)]="selectedNode()!.type" (change)="saveNodes()">
              <option value="skill">Skill</option>
              <option value="agent">Agent</option>
              <option value="api">API</option>
              <option value="condition">Condition</option>
              <option value="delay">Delay</option>
              <option value="transform">Transform</option>
            </select>
          </div>
          @if (selectedNode()!.type === 'skill') {
            <div class="form-group">
              <label>Skill Name</label>
              <input [(ngModel)]="selectedNode()!.data['skill']" placeholder="e.g., marketing-engine" (blur)="saveNodes()">
            </div>
            <div class="form-group">
              <label>Action</label>
              <input [(ngModel)]="selectedNode()!.data['action']" placeholder="e.g., research" (blur)="saveNodes()">
            </div>
          }
          @if (selectedNode()!.type === 'agent') {
            <div class="form-group">
              <label>Agent</label>
              <input [(ngModel)]="selectedNode()!.data['agent']" placeholder="Agent name" (blur)="saveNodes()">
            </div>
          }
          @if (selectedNode()!.type === 'api') {
            <div class="form-group">
              <label>API Endpoint</label>
              <input [(ngModel)]="selectedNode()!.data['endpoint']" placeholder="/api/endpoint" (blur)="saveNodes()">
            </div>
          }
          @if (selectedNode()!.type === 'delay') {
            <div class="form-group">
              <label>Duration (ms)</label>
              <input type="number" [(ngModel)]="selectedNode()!.data['duration']" placeholder="1000" (blur)="saveNodes()">
            </div>
          }
          @if (selectedNode()!.type === 'condition') {
            <div class="form-group">
              <label>Condition</label>
              <input [(ngModel)]="selectedNode()!.data['condition']" placeholder="e.g., data.value > 0" (blur)="saveNodes()">
            </div>
          }
          @if (selectedNode()!.type === 'transform') {
            <div class="form-group">
              <label>Transform</label>
              <input [(ngModel)]="selectedNode()!.data['transform']" placeholder="Transform function" (blur)="saveNodes()">
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .editor { display: flex; flex-direction: column; height: 100vh; background: #f8fafc; }
    .editor-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background: white; border-bottom: 1px solid #e2e8f0; }
    .left { display: flex; align-items: center; gap: 1rem; }
    .back { color: #64748b; text-decoration: none; }
    .title-input { border: none; font-size: 1.25rem; font-weight: 600; padding: 0.5rem; border-radius: 6px; }
    .title-input:focus { outline: 2px solid #667eea; }
    .right { display: flex; gap: 0.75rem; }
    .btn-primary { background: #667eea; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .btn-secondary { background: #e2e8f0; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
    .badge { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
    .badge.draft { background: #f1f5f9; color: #64748b; }
    .badge.active { background: #d1fae5; color: #059669; }
    .toolbar { display: flex; gap: 0.5rem; padding: 1rem 2rem; background: white; border-bottom: 1px solid #e2e8f0; }
    .node-btn { background: white; border: 1px solid #e2e8f0; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
    .node-btn:hover { background: #f1f5f9; border-color: #667eea; }
    .canvas-container { flex: 1; overflow: auto; position: relative; }
    .canvas { position: relative; min-width: 1000px; min-height: 600px; background: #f8fafc; background-image: radial-gradient(circle, #e2e8f0 1px, transparent 1px); background-size: 20px 20px; }
    .node { position: absolute; background: white; border: 2px solid #e2e8f0; border-radius: 10px; padding: 0.75rem; min-width: 100px; text-align: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .node:hover { border-color: #667eea; }
    .node.selected { border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.2); }
    .node.skill { border-left: 4px solid #8b5cf6; }
    .node.agent { border-left: 4px solid #10b981; }
    .node.api { border-left: 4px solid #f59e0b; }
    .node.condition { border-left: 4px solid #ec4899; }
    .node.delay { border-left: 4px solid #6366f1; }
    .node.transform { border-left: 4px solid #14b8a6; }
    .node-icon { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .node-label { font-size: 0.8rem; color: #64748b; }
    .delete-node { position: absolute; top: -8px; right: -8px; background: #dc2626; color: white; border: none; width: 20px; height: 20px; border-radius: 50%; cursor: pointer; font-size: 14px; line-height: 1; }
    .edges-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
    .edge-line { stroke: #94a3b8; stroke-width: 2; }
    .properties-panel { position: fixed; right: 2rem; top: 150px; width: 280px; background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
    .properties-panel h3 { margin: 0 0 1rem; color: #1a1a2e; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-size: 0.85rem; color: #64748b; margin-bottom: 0.25rem; }
    .form-group input, .form-group select { width: 100%; padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 6px; }
  `]
})
export class WorkflowEditorComponent implements OnInit {
  workflow = signal<Workflow | null>(null);
  nodes = signal<WorkflowNode[]>([]);
  edges = signal<WorkflowEdge[]>([]);
  selectedNode = signal<WorkflowNode | null>(null);

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

  addNode(type: string) {
    const newNode: WorkflowNode = {
      id: crypto.randomUUID(),
      nodeId: `node_${Date.now()}`,
      type: type as any,
      positionX: 100 + Math.random() * 400,
      positionY: 100 + Math.random() * 300,
      data: {}
    };
    this.nodes.update(nodes => [...nodes, newNode]);
    this.saveNodes();
  }

  selectNode(node: WorkflowNode, event: Event) {
    event.stopPropagation();
    this.selectedNode.set(node);
  }

  deselectNode() {
    this.selectedNode.set(null);
  }

  deleteNode(id: string, event: Event) {
    event.stopPropagation();
    this.nodes.update(nodes => nodes.filter(n => n.id !== id));
    this.edges.update(edges => edges.filter(e => e.source !== id && e.target !== id));
    if (this.selectedNode()?.id === id) this.selectedNode.set(null);
    this.saveNodes();
  }

  getNodeIcon(type: string): string {
    const icons: Record<string, string> = {
      skill: '⚡', agent: '🤖', api: '🌐', condition: '🔀', delay: '⏱', transform: '🔄'
    };
    return icons[type] || '●';
  }

  getNodeCenter(nodeId: string): { x: number; y: number } {
    const node = this.nodes().find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    return { x: node.positionX + 50, y: node.positionY + 30 };
  }

  save() {
    const wf = this.workflow();
    if (wf) {
      this.api.updateWorkflow(wf.id, { name: wf.name, description: wf.description }).subscribe();
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