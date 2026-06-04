import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { CanvasComponent } from './components/canvas/canvas.component';
import { PropertiesPanelComponent } from './components/properties-panel/properties-panel.component';
import { LearningPathService } from './services/learning-path.service';
import { EncryptionService } from './services/encryption.service';
import { LearningPath, PathNode, PathEdge } from './models/learning-path.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HeaderComponent, SidebarComponent, CanvasComponent, PropertiesPanelComponent],
  template: `
    <div class="app-shell">
      <app-header
        [activeTab]="activeTab"
        (tabChange)="activeTab = $event"
        (saveDraft)="saveDraft()"
        (publish)="publishPath()">
      </app-header>

      <div class="app-body">
        <app-sidebar *ngIf="activeTab === 'builder'"></app-sidebar>

        <app-canvas
          #canvasRef
          [learningPath]="currentPath"
          (nodeSelected)="onNodeSelected($event)"
          (edgeSelected)="onEdgeSelected($event)"
          (pathChanged)="onPathChanged($event)">
        </app-canvas>

        <app-properties-panel
          *ngIf="activeTab === 'builder'"
          [selectedNode]="selectedNode"
          [selectedEdge]="selectedEdge"
          [allNodes]="allNodes"
          [allEdges]="allEdges"
          (nodeUpdated)="onNodeUpdated($event)"
          (edgeUpdated)="onEdgeUpdated($event)"
          (nodeDeleted)="onNodeDeletedFromPanel($event)"
          (edgeDeleted)="onEdgeDeletedFromPanel($event)">
        </app-properties-panel>
      </div>

      <div class="toast" [class.visible]="toastVisible">{{ toastMessage }}</div>
    </div>
  `,
  styles: [`
    .app-shell { height: 100vh; display: flex; flex-direction: column; background: #f9fafb; }
    .app-body { flex: 1; display: flex; overflow: hidden; }
    .toast {
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%) translateY(60px);
      background: #111827; color: #fff; padding: 8px 18px; border-radius: 8px;
      font-size: 13px; transition: transform 0.3s; z-index: 1000; pointer-events: none;
    }
    .toast.visible { transform: translateX(-50%) translateY(0); }
  `]
})
export class AppComponent implements OnInit {
  @ViewChild('canvasRef') canvasRef!: CanvasComponent;

  activeTab: 'builder' | 'preview' = 'builder';
  currentPath: LearningPath | null = null;
  selectedNode: PathNode | null = null;
  selectedEdge: PathEdge | null = null;
  allNodes: PathNode[] = [];
  allEdges: PathEdge[] = [];
  toastVisible = false;
  toastMessage = '';

  constructor(
    private lpService: LearningPathService,
    private encSvc: EncryptionService  // init kicks off public-key fetch
  ) {}

  ngOnInit() {
    // Pre-load the RSA public key so POST/PUT calls are encrypted immediately
    this.encSvc.init().catch(err =>
      console.warn('[App] Encryption init failed — running in plaintext mode', err)
    );
    this.lpService.getById('lp-sat-adaptive-001').subscribe({
      next: (lp) => { this.currentPath = lp; this.allNodes = lp.nodes; this.allEdges = lp.edges; },
      error: () => { this.currentPath = this.defaultPath(); this.allNodes = this.currentPath.nodes; this.allEdges = this.currentPath.edges; }
    });
  }

  onNodeSelected(node: PathNode | null) {
    this.selectedNode = node;
    if (node) this.selectedEdge = null;
  }

  onEdgeSelected(edge: PathEdge | null) {
    this.selectedEdge = edge;
    if (edge) { this.selectedNode = null; this.allNodes = this.allNodes.map(n => ({ ...n, selected: false })); }
  }

  onPathChanged(data: { nodes: PathNode[]; edges: PathEdge[] }) {
    this.allNodes = data.nodes;
    this.allEdges = data.edges;
    if (this.currentPath) this.currentPath = { ...this.currentPath, ...data };
    // Keep selectedEdge in sync
    if (this.selectedEdge) {
      const updated = data.edges.find(e => e.id === this.selectedEdge!.id);
      this.selectedEdge = updated || null;
    }
  }

  onNodeUpdated(partial: Partial<PathNode>) {
    if (!partial.id) return;
    this.allNodes = this.allNodes.map(n => n.id === partial.id ? { ...n, ...partial } : n);
    if (this.currentPath) this.currentPath = { ...this.currentPath, nodes: this.allNodes };
    if (this.selectedNode?.id === partial.id) this.selectedNode = { ...this.selectedNode, ...partial } as PathNode;
    this.canvasRef?.updateNodeConfig(partial.id, partial.label || '', partial.config || {});
  }

  onEdgeUpdated(edge: PathEdge) {
    this.canvasRef?.updateEdge(edge);
    this.selectedEdge = { ...edge };
  }

  onEdgeDeletedFromPanel(edgeId: string) {
    this.canvasRef?.deleteEdge(new MouseEvent('click'), edgeId);
    this.selectedEdge = null;
  }

  onNodeDeletedFromPanel(nodeId: string) {
    // CHANGED: BL-3 — guard against undefined (node may already be removed from canvas)
    const node = this.allNodes.find(n => n.id === nodeId);
    if (node && this.canvasRef) {
      this.canvasRef.deleteNode(new MouseEvent('click'), node);
    }
    this.selectedNode = null;
  }

  saveDraft() {
    if (!this.currentPath) return;
    const lp = { ...this.currentPath, status: 'draft' as const };
    const op = lp.id ? this.lpService.update(lp.id, lp) : this.lpService.create(lp);
    op.subscribe({
      next: (saved) => { this.currentPath = saved; this.showToast('Saved as draft'); },
      error: () => this.showToast('Saved locally (backend offline)')
    });
  }

  publishPath() {
    if (!this.currentPath) return;
    const lp = { ...this.currentPath, status: 'published' as const };
    const op = lp.id ? this.lpService.update(lp.id, lp) : this.lpService.create(lp);
    op.subscribe({
      next: (saved) => { this.currentPath = saved; this.showToast('Published successfully!'); },
      error: () => this.showToast('Publish failed - check backend')
    });
  }

  showToast(msg: string) {
    this.toastMessage = msg; this.toastVisible = true;
    setTimeout(() => { this.toastVisible = false; }, 3000);
  }

  private defaultPath(): LearningPath {
    return {
      id: 'lp-sat-adaptive-001', name: 'SAT Adaptive Path', status: 'draft', version: 1,
      canvas: { zoom: 0.7, offsetX: 20, offsetY: 20 },
      nodes: [
        { id: 'node-start', componentId: 'system-start', type: 'start', label: 'Start Assessment', position: { x: 320, y: 40 } },
        { id: 'node-math-1', componentId: 'cmp-assess-math-1', type: 'assessment', label: 'Math Module 1', position: { x: 255, y: 130 }, config: { approximateDurationMinutes: 35, assessment: { maxScore: 100, passingScore: 50 } } },
        { id: 'node-math-2-group', componentId: 'system-group', type: 'group', label: 'Math Module 2', position: { x: 185, y: 245 } },
        { id: 'node-math-2-easy', componentId: 'cmp-unit-math-2-easy', type: 'unit', label: 'Math Module 2 - Easy', position: { x: 60, y: 370 }, config: { approximateDurationMinutes: 35 } },
        { id: 'node-math-2-adv', componentId: 'cmp-unit-math-2-advanced', type: 'unit', label: 'Math Module 2 - Advanced', position: { x: 340, y: 370 }, config: { approximateDurationMinutes: 35 } },
        { id: 'node-reading-1', componentId: 'cmp-assess-reading-1', type: 'assessment', label: 'Reading & Comp Module 1', position: { x: 230, y: 475 }, config: { approximateDurationMinutes: 32, assessment: { maxScore: 100, passingScore: 60 } } },
        { id: 'node-reading-2-group', componentId: 'system-group', type: 'group', label: 'Reading & Comp Module 2', position: { x: 155, y: 590 } },
        { id: 'node-reading-2-easy', componentId: 'cmp-unit-reading-2-easy', type: 'unit', label: 'R&C Module 2 - Easy', position: { x: 50, y: 715 }, config: { approximateDurationMinutes: 32 } },
        { id: 'node-reading-2-adv', componentId: 'cmp-unit-reading-2-advanced', type: 'unit', label: 'R&C Module 2 - Advanced', position: { x: 330, y: 715 }, config: { approximateDurationMinutes: 32 } },
        { id: 'node-end', componentId: 'system-end', type: 'end', label: 'Complete Assessment', position: { x: 255, y: 830 } }
      ],
      edges: [
        { id: 'e1', sourceNodeId: 'node-start', targetNodeId: 'node-math-1', priority: 1, isDefault: true, conditions: { operator: 'AND', rules: [] } },
        { id: 'e2', sourceNodeId: 'node-math-1', targetNodeId: 'node-math-2-group', priority: 1, isDefault: true, conditions: { operator: 'AND', rules: [] } },
        { id: 'e3', sourceNodeId: 'node-math-2-group', targetNodeId: 'node-math-2-easy', label: 'Score < 50%', priority: 1, isDefault: false, conditions: { operator: 'AND', rules: [{ id: 'r3', sourceType: 'assessment', sourceNodeId: 'node-math-1', metric: 'score_range', operator: 'between', range: { min: 0, max: 49, minInclusive: true, maxInclusive: true } }] } },
        { id: 'e4', sourceNodeId: 'node-math-2-group', targetNodeId: 'node-math-2-adv', label: 'Passed', priority: 2, isDefault: true, conditions: { operator: 'AND', rules: [{ id: 'r4', sourceType: 'assessment', sourceNodeId: 'node-math-1', metric: 'passed', operator: 'eq', value: true }] } },
        { id: 'e5', sourceNodeId: 'node-math-2-easy', targetNodeId: 'node-reading-1', priority: 1, isDefault: true, conditions: { operator: 'AND', rules: [] } },
        { id: 'e6', sourceNodeId: 'node-math-2-adv', targetNodeId: 'node-reading-1', priority: 1, isDefault: true, conditions: { operator: 'AND', rules: [] } },
        { id: 'e7', sourceNodeId: 'node-reading-1', targetNodeId: 'node-reading-2-group', priority: 1, isDefault: true, conditions: { operator: 'AND', rules: [] } },
        { id: 'e8', sourceNodeId: 'node-reading-2-group', targetNodeId: 'node-reading-2-easy', label: 'Score < 60%', priority: 1, isDefault: false, conditions: { operator: 'AND', rules: [{ id: 'r8', sourceType: 'assessment', sourceNodeId: 'node-reading-1', metric: 'score_range', operator: 'between', range: { min: 0, max: 59, minInclusive: true, maxInclusive: true } }] } },
        { id: 'e9', sourceNodeId: 'node-reading-2-group', targetNodeId: 'node-reading-2-adv', label: 'Passed', priority: 2, isDefault: true, conditions: { operator: 'AND', rules: [{ id: 'r9', sourceType: 'assessment', sourceNodeId: 'node-reading-1', metric: 'passed', operator: 'eq', value: true }] } },
        { id: 'e10', sourceNodeId: 'node-reading-2-easy', targetNodeId: 'node-end', priority: 1, isDefault: true, conditions: { operator: 'AND', rules: [] } },
        { id: 'e11', sourceNodeId: 'node-reading-2-adv', targetNodeId: 'node-end', priority: 1, isDefault: true, conditions: { operator: 'AND', rules: [] } }
      ]
    };
  }
}
