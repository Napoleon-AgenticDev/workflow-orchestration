/**
 * ProductsComponent - Angular standalone component for Product & Feature Management UI.
 * 
 * Implements specifications:
 *   - .agent-alchemy/specs/stack/angular/architecture.md#component-structure
 *   - .agent-alchemy/specs/stack/angular/components.md#standalone-components
 *   - .agent-alchemy/specs/stack/angular/services.md#signal-based-state
 *   - .agent-alchemy/specs/frameworks/angular/angular-components-templates.specification.md#control-flow
 * 
 * Feature specification:
 *   - .agent-alchemy/products/alchemy-flow/features/product-feature-management/architecture/system-architecture.specification.md#ui-components
 *   - .agent-alchemy/products/alchemy-flow/features/product-feature-management/plan/functional-requirements.specification.md#user-interactions
 *   - .agent-alchemy/products/alchemy-flow/features/product-feature-management/architecture/system-architecture.specification.md#component-structure
 * 
 * Uses Angular Signals for reactive state management.
 * Per: stack/angular/services.md#signals
 */
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface Product {
  id: string;
  name: string;
  description?: string;
  status: 'Planning' | 'In Progress' | 'Completed';
  metadata?: { owner?: string; team?: string; priority?: string };
  features?: Feature[];
  createdAt: string;
  updatedAt: string;
}

interface Feature {
  id: string;
  name: string;
  description?: string;
  status: 'Todo' | 'In Progress' | 'Done';
  productId: string;
  metadata?: { assignee?: string; priority?: string; storyPoints?: number };
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <header class="header">
        <h1>Products</h1>
        <button class="btn-primary" (click)="showCreateForm = true">+ New Product</button>
      </header>

      @if (showCreateForm) {
        <div class="form-panel">
          <h3>Create Product</h3>
          <div class="form-group">
            <label>Name</label>
            <input [(ngModel)]="newProduct.name" placeholder="Product name" />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea [(ngModel)]="newProduct.description" placeholder="Description"></textarea>
          </div>
          <div class="form-group">
            <label>Status</label>
            <select [(ngModel)]="newProduct.status">
              <option value="Planning">Planning</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div class="form-group">
            <label>Priority</label>
            <select [(ngModel)]="newProduct.metadata.priority">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div class="form-actions">
            <button class="btn-secondary" (click)="showCreateForm = false">Cancel</button>
            <button class="btn-primary" (click)="createProduct()">Create</button>
          </div>
        </div>
      }

      <div class="product-grid">
        @for (product of products(); track product.id) {
          <div class="product-card" [class.completed]="product.status === 'Completed'" [class.in-progress]="product.status === 'In Progress'">
            <div class="card-header">
              <h3>{{ product.name }}</h3>
              <span class="badge" [class]="getStatusClass(product.status)">{{ product.status }}</span>
            </div>
            <p class="description">{{ product.description || 'No description' }}</p>
            <div class="progress-bar">
              <div class="progress" [style.width.%]="getProgress(product)"></div>
            </div>
            <div class="progress-label">{{ getProgress(product) }}% complete ({{ product.features?.length || 0 }} features)</div>
            <div class="card-meta">
              <span>{{ product.metadata?.priority || 'No priority' }}</span>
              <span>{{ product.createdAt | date:'shortDate' }}</span>
            </div>
            <div class="card-actions">
              <button class="btn-secondary" (click)="selectProduct(product)">View Features</button>
              <button class="btn-danger" (click)="deleteProduct(product.id)">Delete</button>
            </div>
          </div>
        } @empty {
          <div class="empty-state">
            <p>No products yet. Create your first product!</p>
          </div>
        }
      </div>

      @if (selectedProduct()) {
        <div class="modal-overlay" (click)="selectedProduct.set(null)">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ selectedProduct()!.name }} - Features</h2>
              <button class="btn-close" (click)="selectedProduct.set(null)">×</button>
            </div>
            <button class="btn-primary mb-4" (click)="showFeatureForm = true">+ Add Feature</button>
            
            @if (showFeatureForm) {
              <div class="form-panel mb-4">
                <h4>Add Feature</h4>
                <div class="form-group">
                  <label>Name</label>
                  <input [(ngModel)]="newFeature.name" placeholder="Feature name" />
                </div>
                <div class="form-group">
                  <label>Description</label>
                  <textarea [(ngModel)]="newFeature.description" placeholder="Description"></textarea>
                </div>
                <div class="form-group">
                  <label>Status</label>
                  <select [(ngModel)]="newFeature.status">
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
                <div class="form-actions">
                  <button class="btn-secondary" (click)="showFeatureForm = false">Cancel</button>
                  <button class="btn-primary" (click)="createFeature()">Add</button>
                </div>
              </div>
            }

            <div class="feature-list">
              @for (feature of features(); track feature.id) {
                <div class="feature-item" [class.done]="feature.status === 'Done'">
                  <div class="feature-info">
                    <span class="feature-name">{{ feature.name }}</span>
                    <span class="badge" [class]="getFeatureStatusClass(feature.status)">{{ feature.status }}</span>
                  </div>
                  <p class="feature-desc">{{ feature.description || '' }}</p>
                  <div class="feature-actions">
                    <select [value]="feature.status" (change)="updateFeatureStatus(feature.id, $any($event.target).value)">
                      <option value="Todo">Todo</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                    <button class="btn-danger" (click)="deleteFeature(feature.id)">Delete</button>
                  </div>
                </div>
              } @empty {
                <p class="empty-features">No features yet. Add one above!</p>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 2rem; max-width: 1200px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    h1 { margin: 0; color: #1a1a2e; }
    .btn-primary { background: #667eea; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-secondary { background: #e2e8f0; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
    .btn-danger { background: #fee2e2; color: #dc2626; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
    .btn-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; }
    .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
    .product-card { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 2px solid transparent; transition: all 0.2s; }
    .product-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
    .product-card.completed { border-color: #10b981; }
    .product-card.in-progress { border-color: #f59e0b; }
    .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; }
    .card-header h3 { margin: 0; color: #1a1a2e; font-size: 1.1rem; }
    .badge { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
    .badge.planning { background: #f1f5f9; color: #64748b; }
    .badge.in-progress { background: #fef3c7; color: #d97706; }
    .badge.completed { background: #d1fae5; color: #059669; }
    .badge.todo { background: #f1f5f9; color: #64748b; }
    .badge.done { background: #d1fae5; color: #059669; }
    .description { color: #64748b; font-size: 0.9rem; margin: 0.5rem 0; }
    .progress-bar { background: #e2e8f0; border-radius: 4px; height: 8px; margin: 1rem 0 0.5rem; overflow: hidden; }
    .progress { background: #667eea; height: 100%; transition: width 0.3s; }
    .progress-label { font-size: 0.75rem; color: #64748b; }
    .card-meta { display: flex; gap: 1rem; color: #94a3b8; font-size: 0.8rem; margin: 1rem 0; }
    .card-actions { display: flex; gap: 0.5rem; }
    .empty-state { grid-column: 1 / -1; text-align: center; padding: 3rem; color: #64748b; }
    .form-panel { background: #f8fafc; padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; }
    .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 6px; }
    .form-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: white; border-radius: 12px; padding: 2rem; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .mb-4 { margin-bottom: 1rem; }
    .feature-list { display: flex; flex-direction: column; gap: 1rem; }
    .feature-item { border: 1px solid #e2e8f0; padding: 1rem; border-radius: 8px; }
    .feature-item.done { background: #f0fdf4; }
    .feature-info { display: flex; justify-content: space-between; align-items: center; }
    .feature-name { font-weight: 600; }
    .feature-desc { color: #64748b; font-size: 0.875rem; margin: 0.5rem 0; }
    .feature-actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
    .feature-actions select { padding: 0.25rem; border: 1px solid #e2e8f0; border-radius: 4px; }
    .empty-features { color: #64748b; text-align: center; padding: 1rem; }
  `]
})
export class ProductsComponent implements OnInit {
  products = signal<Product[]>([]);
  features = signal<Feature[]>([]);
  selectedProduct = signal<Product | null>(null);
  showCreateForm = false;
  showFeatureForm = false;

  newProduct = { name: '', description: '', status: 'Planning' as const, metadata: { priority: 'medium' as const } };
  newFeature = { name: '', description: '', status: 'Todo' as const };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.api.getProducts().subscribe(data => this.products.set(data));
  }

  createProduct() {
    this.api.createProduct(this.newProduct).subscribe(() => {
      this.showCreateForm = false;
      this.newProduct = { name: '', description: '', status: 'Planning', metadata: { priority: 'medium' } };
      this.loadProducts();
    });
  }

  deleteProduct(id: string) {
    if (confirm('Delete this product?')) {
      this.api.deleteProduct(id).subscribe(() => this.loadProducts());
    }
  }

  selectProduct(product: Product) {
    this.selectedProduct.set(product);
    this.loadFeatures(product.id);
  }

  loadFeatures(productId: string) {
    this.api.getFeaturesByProduct(productId).subscribe(data => this.features.set(data));
  }

  createFeature() {
    const feature = { ...this.newFeature, productId: this.selectedProduct()!.id };
    this.api.createFeature(feature).subscribe(() => {
      this.showFeatureForm = false;
      this.newFeature = { name: '', description: '', status: 'Todo' };
      this.loadFeatures(this.selectedProduct()!.id);
      this.loadProducts();
    });
  }

  updateFeatureStatus(id: string, status: string) {
    this.api.updateFeature(id, { status: status as any }).subscribe(() => {
      this.loadFeatures(this.selectedProduct()!.id);
      this.loadProducts();
    });
  }

  deleteFeature(id: string) {
    this.api.deleteFeature(id).subscribe(() => {
      this.loadFeatures(this.selectedProduct()!.id);
      this.loadProducts();
    });
  }

  getProgress(product: Product): number {
    if (!product.features?.length) return 0;
    const done = product.features.filter(f => f.status === 'Done').length;
    return Math.round((done / product.features.length) * 100);
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace(' ', '-');
  }

  getFeatureStatusClass(status: string): string {
    return status.toLowerCase().replace(' ', '-');
  }
}
