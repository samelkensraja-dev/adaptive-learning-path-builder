import {
  Component, OnInit, ElementRef, ViewChild,
  Output, EventEmitter, Input, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PathNode, PathEdge, LearningPath, CanvasState } from '../../models/learning-path.model';

interface GhostLine { x1: number; y1: number; x2: number; y2: number; }

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="canvas-wrapper">
      <!-- Toolbar -->
      <div class="canvas-toolbar">
        <button class="zoom-btn" (click)="zoom(-0.1)" title="Zoom out">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </button>
        <span class="zoom-label">{{ (canvasState.zoom * 100) | number:'1.0-0' }}%</span>
        <button class="zoom-btn" (click)="zoom(0.1)" title="Zoom in">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </button>
        <button class="zoom-btn" (click)="fitToScreen()" title="Fit to screen">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/>
          </svg>
        </button>
        <!-- Connecting mode indicator -->
        <span *ngIf="connectingFromId" class="connecting-hint">
          🔗 Click a node to connect
          <button class="cancel-connect" (click)="cancelConnect()">✕</button>
        </span>
      </div>

      <!-- Canvas -->
      <div #canvasEl class="canvas"
           [class.connecting-mode]="!!connectingFromId"
           (dragover)="onDragOver($event)"
           (drop)="onDrop($event)"
           (mousedown)="onCanvasMouseDown($event)"
           (mousemove)="onCanvasMouseMove($event)"
           (mouseup)="onCanvasMouseUp($event)"
           (click)="onCanvasClick($event)">

        <div class="canvas-content"
             [style.transform]="'scale(' + canvasState.zoom + ') translate(' + canvasState.offsetX + 'px,' + canvasState.offsetY + 'px)'">

          <!-- SVG layer: edges + ghost line -->
          <svg class="edges-svg" [attr.width]="svgWidth" [attr.height]="svgHeight">
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#9ca3af"/>
              </marker>
              <marker id="arrow-sel" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#3b82f6"/>
              </marker>
              <marker id="arrow-ghost" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#8b5cf6"/>
              </marker>
            </defs>

            <!-- Existing edges -->
            <g *ngFor="let edge of edges" class="edge-group"
               [class.edge-selected]="edge.id === selectedEdgeId">
              <!-- Wide invisible hit area for easy clicking -->
              <path [attr.d]="getEdgePath(edge)"
                    class="edge-hit"
                    (click)="onEdgeClick($event, edge)"
                    fill="none"/>
              <!-- Visible path -->
              <path [attr.d]="getEdgePath(edge)"
                    [class]="'edge-path ' + getEdgeClass(edge) + (edge.id === selectedEdgeId ? ' edge-path-selected' : '')"
                    [attr.marker-end]="edge.id === selectedEdgeId ? 'url(#arrow-sel)' : 'url(#arrow)'"
                    (click)="onEdgeClick($event, edge)"
                    fill="none"/>
              <!-- Label -->
              <text *ngIf="edge.label"
                    [attr.x]="getEdgeLabelPos(edge).x"
                    [attr.y]="getEdgeLabelPos(edge).y"
                    class="edge-label" text-anchor="middle">{{ edge.label }}</text>
              <!-- Delete button on selected edge -->
              <g *ngIf="edge.id === selectedEdgeId" class="edge-del-group"
                 (click)="deleteEdge($event, edge.id)">
                <circle [attr.cx]="getEdgeLabelPos(edge).x"
                        [attr.cy]="getEdgeLabelPos(edge).y - 14"
                        r="8" fill="#ef4444" stroke="#fff" stroke-width="1.5"/>
                <text [attr.x]="getEdgeLabelPos(edge).x"
                      [attr.y]="getEdgeLabelPos(edge).y - 10"
                      text-anchor="middle" fill="#fff" font-size="11" font-weight="700">×</text>
              </g>
            </g>

            <!-- Ghost line while connecting -->
            <line *ngIf="ghostLine"
                  [attr.x1]="ghostLine.x1" [attr.y1]="ghostLine.y1"
                  [attr.x2]="ghostLine.x2" [attr.y2]="ghostLine.y2"
                  class="ghost-edge" marker-end="url(#arrow-ghost)"/>
          </svg>

          <!-- Nodes -->
          <div *ngFor="let node of nodes"
               class="node-wrapper"
               [class.selected]="node.selected"
               [class.connect-target]="!!connectingFromId && node.id !== connectingFromId"
               [style.left.px]="node.position.x"
               [style.top.px]="node.position.y"
               (mousedown)="onNodeMouseDown($event, node)"
               (mouseup)="onNodeMouseUp($event, node)"
               (click)="onNodeClick($event, node)">

            <!-- START node -->
            <div *ngIf="node.type === 'start'" class="node node-start">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <span>{{ node.label }}</span>
            </div>

            <!-- END node -->
            <div *ngIf="node.type === 'end'" class="node node-end">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 8 12 12 14 14"/>
              </svg>
              <span>{{ node.label }}</span>
            </div>

            <!-- ASSESSMENT node -->
            <div *ngIf="node.type === 'assessment'" class="node node-assessment">
              <div class="node-icon-row">
                <div class="node-type-badge badge-assessment">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                  </svg>
                </div>
                <span class="node-label">{{ node.label }}</span>
              </div>
              <div class="node-meta" *ngIf="node.config">
                <span *ngIf="node.config.assessment">Max: {{ node.config.assessment.maxScore }} • Pass: {{ node.config.assessment.passingScore }}</span>
                <span *ngIf="node.config.approximateDurationMinutes"> • {{ node.config.approximateDurationMinutes }} min</span>
              </div>
            </div>

            <!-- UNIT node -->
            <div *ngIf="node.type === 'unit'" class="node node-unit">
              <div class="node-icon-row">
                <div class="node-type-badge badge-unit">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <rect x="3" y="2" width="18" height="20" rx="2"/>
                    <line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/>
                    <line x1="7" y1="16" x2="13" y2="16"/>
                  </svg>
                </div>
                <span class="node-label">{{ node.label }}</span>
              </div>
              <div class="node-meta" *ngIf="node.config?.approximateDurationMinutes">
                {{ node.config!.approximateDurationMinutes }} min
              </div>
            </div>

            <!-- GROUP node -->
            <div *ngIf="node.type === 'group'" class="node node-group">
              <div class="node-icon-row">
                <div class="node-type-badge badge-group">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                  </svg>
                </div>
                <span class="node-label">{{ node.label }}</span>
              </div>
              <span class="node-group-hint">Adaptive based on performance</span>
            </div>

            <!-- Connect port (bottom) — drag to create edge -->
            <div *ngIf="node.type !== 'end'"
                 class="node-port"
                 title="Drag to connect"
                 (mousedown)="onPortMouseDown($event, node)">
              <svg width="8" height="8" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="3" fill="#3b82f6" stroke="#fff" stroke-width="1"/>
              </svg>
            </div>

            <!-- Delete btn -->
            <button class="node-delete" (click)="deleteNode($event, node)" title="Remove node">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .canvas-wrapper { flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; }

    .canvas-toolbar {
      display: flex; align-items: center; gap: 4px;
      position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
      background: #fff; border: 1px solid #e5e7eb; border-radius: 8px;
      padding: 4px 8px; z-index: 10; box-shadow: 0 1px 4px rgba(0,0,0,.08);
    }
    .zoom-btn {
      width: 26px; height: 26px; border: none; background: transparent; border-radius: 5px;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      color: #6b7280; transition: all 0.15s;
    }
    .zoom-btn:hover { background: #f3f4f6; color: #111827; }
    .zoom-label { font-size: 12px; font-weight: 600; color: #374151; min-width: 36px; text-align: center; }
    .connecting-hint {
      display: flex; align-items: center; gap: 6px; font-size: 11px;
      font-weight: 600; color: #7c3aed; background: #ede9fe;
      padding: 3px 8px; border-radius: 5px;
    }
    .cancel-connect {
      border: none; background: transparent; color: #7c3aed; cursor: pointer;
      font-size: 12px; padding: 0; line-height: 1;
    }

    .canvas {
      flex: 1; overflow: hidden; background: #f9fafb;
      background-image: radial-gradient(#d1d5db 1px, transparent 1px);
      background-size: 24px 24px; cursor: default; position: relative;
    }
    .canvas.connecting-mode { cursor: crosshair; }
    .canvas-content { position: relative; width: 1400px; height: 1200px; transform-origin: top left; }

    /* SVG edges layer — pointer-events enabled so edges are clickable */
    .edges-svg { position: absolute; top: 0; left: 0; overflow: visible; }
    .edge-hit { stroke: transparent; stroke-width: 12; cursor: pointer; pointer-events: stroke; }
    .edge-path { stroke: #9ca3af; stroke-width: 1.5; pointer-events: none; }
    .edge-path.edge-conditional { stroke: #3b82f6; stroke-dasharray: 5,3; }
    .edge-path.edge-path-selected { stroke: #3b82f6; stroke-width: 2; }
    .edge-label { font-size: 10px; fill: #6b7280; font-family: inherit; pointer-events: none; }
    .edge-del-group { cursor: pointer; }
    .ghost-edge { stroke: #8b5cf6; stroke-width: 1.5; stroke-dasharray: 6,3; pointer-events: none; }

    .node-wrapper { position: absolute; cursor: pointer; user-select: none; }
    .node-wrapper.selected .node { box-shadow: 0 0 0 2px #3b82f6 !important; }
    .node-wrapper.connect-target:hover .node { box-shadow: 0 0 0 2px #8b5cf6 !important; cursor: crosshair; }
    .node-wrapper:hover .node-delete { opacity: 1; }
    .node-wrapper:hover .node-port { opacity: 1; }

    .node-port {
      position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%);
      width: 16px; height: 16px; display: flex; align-items: center; justify-content: center;
      cursor: crosshair; opacity: 0; transition: opacity 0.15s; z-index: 6;
      background: #fff; border-radius: 50%;
    }
    .node-delete {
      position: absolute; top: -8px; right: -8px; width: 18px; height: 18px;
      border-radius: 50%; border: 1px solid #e5e7eb; background: #fff; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #ef4444; opacity: 0; transition: opacity 0.15s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1); z-index: 5;
    }

    .node {
      display: flex; flex-direction: column; gap: 3px;
      border-radius: 10px; padding: 8px 12px; font-size: 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.1); transition: box-shadow 0.15s; position: relative;
    }
    .node:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.15); }

    .node-start {
      background: #dcfce7; border: 1.5px solid #16a34a; color: #166534;
      font-weight: 600; font-size: 13px; min-width: 150px;
      flex-direction: row; align-items: center; gap: 6px; justify-content: center;
    }
    .node-end {
      background: #f3f4f6; border: 1.5px solid #9ca3af; color: #374151;
      font-weight: 600; font-size: 13px; min-width: 150px;
      flex-direction: row; align-items: center; gap: 6px; justify-content: center;
    }
    .node-assessment { background: #fff; border: 1.5px solid #93c5fd; min-width: 180px; }
    .node-unit { background: #fff; border: 1.5px solid #93c5fd; min-width: 160px; }
    .node-group { background: #faf5ff; border: 2px dashed #a78bfa; min-width: 220px; }

    .node-icon-row { display: flex; align-items: center; gap: 6px; }
    .node-type-badge {
      width: 20px; height: 20px; border-radius: 4px; display: flex;
      align-items: center; justify-content: center; flex-shrink: 0;
    }
    .badge-assessment { background: #dbeafe; color: #3b82f6; }
    .badge-unit { background: #f0fdf4; color: #16a34a; }
    .badge-group { background: #ede9fe; color: #7c3aed; }
    .node-label { font-weight: 600; color: #111827; font-size: 12px; }
    .node-meta { font-size: 10px; color: #9ca3af; padding-left: 26px; }
    .node-group-hint { font-size: 10px; color: #7c3aed; padding-left: 26px; font-style: italic; }
  `]
})
export class CanvasComponent implements OnInit, OnDestroy {
  @Input() set learningPath(lp: LearningPath | null) {
    if (lp) { this.nodes = [...lp.nodes]; this.edges = [...lp.edges]; }
  }
  @Output() nodeSelected   = new EventEmitter<PathNode | null>();
  @Output() edgeSelected   = new EventEmitter<PathEdge | null>();
  @Output() pathChanged    = new EventEmitter<{ nodes: PathNode[]; edges: PathEdge[] }>();

  @ViewChild('canvasEl') canvasEl!: ElementRef<HTMLDivElement>;

  nodes: PathNode[]    = [];
  edges: PathEdge[]    = [];
  canvasState: CanvasState = { zoom: 0.7, offsetX: 20, offsetY: 20 };
  svgWidth  = 1400;
  svgHeight = 1200;

  // Drag state
  private draggingNodeId: string | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private nodeCounter = 100;
  private edgeCounter = 200;

  // Connection state
  connectingFromId: string | null = null;
  ghostLine: GhostLine | null = null;

  // Selected edge
  selectedEdgeId: string | null = null;

  ngOnInit() {}
  ngOnDestroy() {}

  // ── Zoom / pan ─────────────────────────────────────────────────────────────
  zoom(delta: number) {
    this.canvasState.zoom = Math.max(0.2, Math.min(2, this.canvasState.zoom + delta));
  }
  fitToScreen() {
    this.canvasState = { zoom: 0.7, offsetX: 20, offsetY: 20 };
  }

  // ── Drag from sidebar ──────────────────────────────────────────────────────
  onDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    const type        = e.dataTransfer?.getData('nodeType') as PathNode['type'];
    const componentId = e.dataTransfer?.getData('componentId') || 'system-' + type;
    const label       = e.dataTransfer?.getData('label') || 'New Node';
    const duration    = Number(e.dataTransfer?.getData('duration') || 0);
    const metaStr     = e.dataTransfer?.getData('meta') || '';

    const rect = this.canvasEl.nativeElement.getBoundingClientRect();
    const x = (e.clientX - rect.left) / this.canvasState.zoom - this.canvasState.offsetX;
    const y = (e.clientY - rect.top)  / this.canvasState.zoom - this.canvasState.offsetY;

    const config: { approximateDurationMinutes?: number; assessment?: { maxScore: number; passingScore: number } } = {};
    if (duration > 0 && duration <= 600) config.approximateDurationMinutes = duration;
    if (metaStr) {
      try {
        const p = JSON.parse(metaStr);
        if (p && typeof p.maxScore === 'number' && typeof p.passingScore === 'number')
          config.assessment = { maxScore: p.maxScore, passingScore: p.passingScore };
      } catch { /**/ }
    }

    const newNode: PathNode = {
      id: 'node-' + (++this.nodeCounter),
      componentId,
      type: type || 'unit',
      label,
      position: { x: Math.round(x - 90), y: Math.round(y - 20) },
      config: Object.keys(config).length ? config : undefined
    };
    this.nodes = [...this.nodes, newNode];
    this.emitChange();
  }

  // ── Node drag ──────────────────────────────────────────────────────────────
  onNodeMouseDown(e: MouseEvent, node: PathNode) {
    if (this.connectingFromId) return; // in connect mode — handled by onNodeMouseUp
    e.stopPropagation();
    this.draggingNodeId = node.id;
    this.dragOffsetX = e.clientX / this.canvasState.zoom - node.position.x;
    this.dragOffsetY = e.clientY / this.canvasState.zoom - node.position.y;

    const move = (ev: MouseEvent) => {
      if (!this.draggingNodeId) return;
      const pos = {
        x: Math.round(ev.clientX / this.canvasState.zoom - this.dragOffsetX),
        y: Math.round(ev.clientY / this.canvasState.zoom - this.dragOffsetY)
      };
      this.nodes = this.nodes.map(n => n.id === this.draggingNodeId ? { ...n, position: pos } : n);
    };
    const up = () => {
      this.draggingNodeId = null;
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      this.emitChange();
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }

  // ── Node click (select) ────────────────────────────────────────────────────
  onNodeClick(e: MouseEvent, node: PathNode) {
    e.stopPropagation();
    if (this.connectingFromId) return; // completed in mouseup
    this.selectedEdgeId = null;
    this.nodes = this.nodes.map(n => ({ ...n, selected: n.id === node.id }));
    this.nodeSelected.emit(node);
    this.edgeSelected.emit(null);
  }

  // ── Port mousedown — start connection ─────────────────────────────────────
  onPortMouseDown(e: MouseEvent, node: PathNode) {
    e.stopPropagation();
    e.preventDefault();
    this.connectingFromId = node.id;
    // Start ghost line at node bottom center
    const center = this.getNodeBottomCenter(node.id);
    if (center) this.ghostLine = { x1: center.x, y1: center.y, x2: center.x, y2: center.y };
  }

  // ── Canvas mousemove — update ghost line ───────────────────────────────────
  onCanvasMouseMove(e: MouseEvent) {
    if (!this.connectingFromId || !this.ghostLine) return;
    const rect = this.canvasEl.nativeElement.getBoundingClientRect();
    const x = (e.clientX - rect.left) / this.canvasState.zoom - this.canvasState.offsetX;
    const y = (e.clientY - rect.top)  / this.canvasState.zoom - this.canvasState.offsetY;
    this.ghostLine = { ...this.ghostLine, x2: x, y2: y };
  }

  // ── Node mouseup — complete connection ─────────────────────────────────────
  onNodeMouseUp(e: MouseEvent, targetNode: PathNode) {
    if (!this.connectingFromId) return;
    e.stopPropagation();
    const fromId = this.connectingFromId;
    this.cancelConnect();

    if (fromId === targetNode.id) return; // no self-loop
    // Prevent duplicate edge
    const exists = this.edges.some(
      ed => ed.sourceNodeId === fromId && ed.targetNodeId === targetNode.id
    );
    if (exists) return;

    const newEdge: PathEdge = {
      id: 'edge-' + (++this.edgeCounter),
      sourceNodeId: fromId,
      targetNodeId: targetNode.id,
      priority: 1,
      isDefault: true,
      conditions: { operator: 'AND', rules: [] }
    };
    this.edges = [...this.edges, newEdge];
    this.emitChange();
  }

  // ── Canvas mouseup — cancel if released on empty space ────────────────────
  onCanvasMouseUp(e: MouseEvent) {
    if (this.connectingFromId) this.cancelConnect();
  }

  cancelConnect() {
    this.connectingFromId = null;
    this.ghostLine = null;
  }

  // ── Canvas click (deselect) ────────────────────────────────────────────────
  onCanvasClick(e: MouseEvent) {
    this.nodes = this.nodes.map(n => ({ ...n, selected: false }));
    this.selectedEdgeId = null;
    this.nodeSelected.emit(null);
    this.edgeSelected.emit(null);
  }

  // ── Canvas pan ─────────────────────────────────────────────────────────────
  onCanvasMouseDown(e: MouseEvent) {
    if (this.connectingFromId) return;
    if ((e.target as HTMLElement).closest('.node-wrapper, .edge-hit, .edge-del-group')) return;
    const sx = e.clientX, sy = e.clientY;
    const ox = this.canvasState.offsetX, oy = this.canvasState.offsetY;
    const move = (ev: MouseEvent) => {
      this.canvasState = {
        ...this.canvasState,
        offsetX: ox + (ev.clientX - sx) / this.canvasState.zoom,
        offsetY: oy + (ev.clientY - sy) / this.canvasState.zoom
      };
    };
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }

  // ── Edge click (select) ────────────────────────────────────────────────────
  onEdgeClick(e: MouseEvent, edge: PathEdge) {
    e.stopPropagation();
    this.selectedEdgeId = edge.id;
    this.nodes = this.nodes.map(n => ({ ...n, selected: false }));
    this.nodeSelected.emit(null);
    this.edgeSelected.emit(edge);
  }

  // ── Edge delete ────────────────────────────────────────────────────────────
  deleteEdge(e: MouseEvent, edgeId: string) {
    e.stopPropagation();
    this.edges = this.edges.filter(ed => ed.id !== edgeId);
    this.selectedEdgeId = null;
    this.edgeSelected.emit(null);
    this.emitChange();
  }

  // ── Node delete ────────────────────────────────────────────────────────────
  deleteNode(e: MouseEvent, node: PathNode) {
    e.stopPropagation();
    this.nodes = this.nodes.filter(n => n.id !== node.id);
    this.edges = this.edges.filter(ed => ed.sourceNodeId !== node.id && ed.targetNodeId !== node.id);
    this.nodeSelected.emit(null);
    this.emitChange();
  }

  // ── Public: update node from properties panel ──────────────────────────────
  updateNodeConfig(nodeId: string, label: string, config: any) {
    this.nodes = this.nodes.map(n => n.id === nodeId ? { ...n, label, config } : n);
    this.emitChange();
  }

  // ── Public: update edge from properties panel ─────────────────────────────
  updateEdge(updatedEdge: PathEdge) {
    this.edges = this.edges.map(e => e.id === updatedEdge.id ? { ...updatedEdge } : e);
    this.emitChange();
  }

  // ── Geometry helpers ───────────────────────────────────────────────────────
  private nodeSize(node: PathNode): { w: number; h: number } {
    if (node.type === 'start' || node.type === 'end') return { w: 160, h: 38 };
    if (node.type === 'group')                         return { w: 220, h: 56 };
    return { w: 190, h: 52 };
  }

  private getNodeBottomCenter(nodeId: string): { x: number; y: number } | null {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return null;
    const { w, h } = this.nodeSize(node);
    return { x: node.position.x + w / 2, y: node.position.y + h };
  }

  getNodeCenter(nodeId: string): { x: number; y: number } | null {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return null;
    const { w, h } = this.nodeSize(node);
    return { x: node.position.x + w / 2, y: node.position.y + h / 2 };
  }

  getEdgePath(edge: PathEdge): string {
    const src = this.nodes.find(n => n.id === edge.sourceNodeId);
    const tgt = this.nodes.find(n => n.id === edge.targetNodeId);
    if (!src || !tgt) return '';
    const { w: sw, h: sh } = this.nodeSize(src);
    const { w: tw, h: th } = this.nodeSize(tgt);
    const x1 = src.position.x + sw / 2, y1 = src.position.y + sh;
    const x2 = tgt.position.x + tw / 2, y2 = tgt.position.y;
    const cy1 = y1 + (y2 - y1) * 0.4;
    const cy2 = y2 - (y2 - y1) * 0.4;
    return `M${x1},${y1} C${x1},${cy1} ${x2},${cy2} ${x2},${y2}`;
  }

  getEdgeLabelPos(edge: PathEdge): { x: number; y: number } {
    const src = this.getNodeCenter(edge.sourceNodeId);
    const tgt = this.getNodeCenter(edge.targetNodeId);
    if (!src || !tgt) return { x: 0, y: 0 };
    return { x: (src.x + tgt.x) / 2, y: (src.y + tgt.y) / 2 - 4 };
  }

  getEdgeClass(edge: PathEdge): string {
    return (edge.conditions?.rules?.length ?? 0) > 0 ? 'edge-conditional' : '';
  }

  private emitChange() {
    this.pathChanged.emit({ nodes: this.nodes, edges: this.edges });
  }
}
