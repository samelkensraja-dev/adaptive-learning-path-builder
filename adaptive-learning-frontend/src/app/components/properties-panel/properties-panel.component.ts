import {
  Component, Input, Output, EventEmitter, OnChanges, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PathNode, PathEdge } from '../../models/learning-path.model';

@Component({
  selector: 'app-properties-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <aside class="properties-panel">

      <!-- Header -->
      <div class="panel-header">
        <div class="panel-title-row">
          <span class="panel-title">Properties</span>
          <span class="type-badge" [class]="'badge-' + (selectedNode?.type || selectedEdge ? 'edge' : 'none')">
            {{ selectedNode ? nodeTypeLabel : selectedEdge ? 'Connection' : '' }}
          </span>
        </div>
        <button *ngIf="selectedNode" class="delete-btn" (click)="onDeleteNode()" title="Delete node">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
          </svg>
        </button>
        <button *ngIf="selectedEdge" class="delete-btn" (click)="onDeleteEdge()" title="Delete connection">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
          </svg>
        </button>
      </div>

      <!-- Empty state -->
      <div class="empty-state" *ngIf="!selectedNode && !selectedEdge">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.2">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
          <line x1="9.5" y1="6.5" x2="14" y2="6.5" stroke-dasharray="2,2"/>
          <line x1="17.5" y1="10" x2="17.5" y2="14" stroke-dasharray="2,2"/>
        </svg>
        <p>Click a <strong>node</strong> to edit its properties<br>or click an <strong>arrow</strong> to edit the connection</p>
      </div>

      <!-- ══ NODE PROPERTIES ══════════════════════════════════════════════ -->
      <div class="panel-body" *ngIf="selectedNode">

        <!-- Label -->
        <div class="field">
          <label class="field-label">Label</label>
          <input class="field-input" type="text" [(ngModel)]="editLabel"
                 (ngModelChange)="onNodeFieldChange()" placeholder="Node label" />
        </div>

        <!-- Description -->
        <div class="field">
          <label class="field-label">Description</label>
          <textarea class="field-textarea" rows="2" [(ngModel)]="editDescription"
                    placeholder="Enter description" (ngModelChange)="onNodeFieldChange()"></textarea>
        </div>

        <!-- Assessment config -->
        <div *ngIf="selectedNode.type === 'assessment'" class="section-group">
          <div class="section-group-title">Assessment Settings</div>
          <div class="field-row">
            <div class="field">
              <label class="field-label">Max Score</label>
              <input class="field-input" type="number" [(ngModel)]="maxScore" min="1"
                     (ngModelChange)="onNodeFieldChange()" />
            </div>
            <div class="field">
              <label class="field-label">Passing Score</label>
              <input class="field-input" type="number" [(ngModel)]="passingScore" min="0"
                     (ngModelChange)="onNodeFieldChange()" />
            </div>
          </div>
        </div>

        <!-- Section Details -->
        <div class="section-group">
          <div class="section-group-title">Section Details</div>
          <div class="field-row">
            <div class="field">
              <label class="field-label">Duration (min)</label>
              <input class="field-input" type="number" [(ngModel)]="editDuration" min="0"
                     (ngModelChange)="onNodeFieldChange()" />
            </div>
            <div class="field">
              <label class="field-label">Difficulty</label>
              <select class="field-select" [(ngModel)]="editDifficulty" (ngModelChange)="onNodeFieldChange()">
                <option value="">Select</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Incoming connections (with conditions) -->
        <div class="section-group"
             *ngIf="selectedNode.type !== 'start' && incomingEdges.length > 0">
          <div class="section-group-title">Incoming Connections</div>
          <div *ngFor="let edge of incomingEdges" class="connection-chip">
            <div class="chip-from">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
              <span>From: <strong>{{ getNodeLabel(edge.sourceNodeId) }}</strong></span>
            </div>
            <div *ngIf="edge.label" class="chip-condition">{{ edge.label }}</div>
          </div>
        </div>

        <!-- Outgoing connections -->
        <div class="section-group" *ngIf="selectedNode.type !== 'end' && outgoingEdges.length > 0">
          <div class="section-group-title">Outgoing Connections</div>
          <div *ngFor="let edge of outgoingEdges" class="connection-chip">
            <div class="chip-from">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
              <span>To: <strong>{{ getNodeLabel(edge.targetNodeId) }}</strong></span>
            </div>
            <div *ngIf="edge.label" class="chip-condition">{{ edge.label }}</div>
          </div>
        </div>

        <!-- No connections hint for new nodes -->
        <div class="connect-hint"
             *ngIf="selectedNode.type !== 'start' && selectedNode.type !== 'end'
                    && incomingEdges.length === 0 && outgoingEdges.length === 0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
          </svg>
          <span>No connections yet.<br>Hover the node and drag the <strong>blue port dot</strong> to connect.</span>
        </div>

        <!-- Node ID -->
        <div class="meta-row">
          <span class="meta-label">ID</span>
          <span class="meta-val">{{ selectedNode.id }}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Component</span>
          <span class="meta-val">{{ selectedNode.componentId }}</span>
        </div>
      </div>

      <!-- ══ EDGE PROPERTIES ══════════════════════════════════════════════ -->
      <div class="panel-body" *ngIf="selectedEdge && !selectedNode">

        <!-- Connection route -->
        <div class="edge-route">
          <div class="route-node">{{ getNodeLabel(selectedEdge.sourceNodeId) }}</div>
          <svg width="20" height="12" viewBox="0 0 20 12">
            <path d="M0 6h16M12 2l6 4-6 4" stroke="#6b7280" stroke-width="1.5" fill="none"/>
          </svg>
          <div class="route-node">{{ getNodeLabel(selectedEdge.targetNodeId) }}</div>
        </div>

        <!-- Edge label -->
        <div class="field">
          <label class="field-label">Connection Label</label>
          <input class="field-input" type="text" [(ngModel)]="edgeLabel"
                 placeholder="e.g. Score &lt; 50%" (ngModelChange)="onEdgeFieldChange()" />
        </div>

        <!-- Priority & Default -->
        <div class="field-row">
          <div class="field">
            <label class="field-label">Priority</label>
            <input class="field-input" type="number" [(ngModel)]="edgePriority" min="1"
                   (ngModelChange)="onEdgeFieldChange()" />
          </div>
          <div class="field" style="justify-content: flex-end; padding-top: 16px;">
            <label class="checkbox-row">
              <input type="checkbox" [(ngModel)]="edgeIsDefault" (ngModelChange)="onEdgeFieldChange()" />
              <span class="field-label" style="margin: 0;">Default route</span>
            </label>
          </div>
        </div>

        <!-- Conditions -->
        <div class="section-group">
          <div class="section-group-header">
            <span class="section-group-title">Conditions</span>
            <button class="add-btn" (click)="addEdgeCondition()">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add
            </button>
          </div>
          <p class="conditions-hint">Define when learners take this route</p>

          <div *ngFor="let rule of edgeRules; let i = index" class="condition-card">
            <div class="condition-header">
              <span class="condition-title">Rule {{ i + 1 }}</span>
              <button class="remove-cond-btn" (click)="removeEdgeCondition(i)">×</button>
            </div>
            <div class="field">
              <label class="field-label">Source Section</label>
              <select class="field-select" [(ngModel)]="rule.sourceNodeId"
                      (ngModelChange)="onEdgeFieldChange()">
                <option value="">Select assessment</option>
                <option *ngFor="let n of assessmentNodes" [value]="n.id">{{ n.label }}</option>
              </select>
            </div>
            <div class="field">
              <label class="field-label">Metric</label>
              <select class="field-select" [(ngModel)]="rule.metric" (ngModelChange)="onEdgeFieldChange()">
                <option value="passed">Passed</option>
                <option value="score">Score</option>
                <option value="score_range">Score Range</option>
                <option value="completion">Completion</option>
                <option value="percentage_completion">% Completion</option>
              </select>
            </div>
            <div class="field-row" *ngIf="rule.metric !== 'score_range'">
              <div class="field">
                <label class="field-label">Operator</label>
                <select class="field-select" [(ngModel)]="rule.operator" (ngModelChange)="onEdgeFieldChange()">
                  <option value="eq">Equal (=)</option>
                  <option value="ne">Not Equal (≠)</option>
                  <option value="gt">Greater than (&gt;)</option>
                  <option value="gte">Greater or equal (≥)</option>
                  <option value="lt">Less than (&lt;)</option>
                  <option value="lte">Less or equal (≤)</option>
                </select>
              </div>
              <div class="field">
                <label class="field-label">Value</label>
                <input class="field-input" [(ngModel)]="rule.value" (ngModelChange)="onEdgeFieldChange()"
                       [type]="rule.metric === 'passed' || rule.metric === 'completion' ? 'text' : 'number'" />
              </div>
            </div>
            <div class="field-row" *ngIf="rule.metric === 'score_range'">
              <div class="field">
                <label class="field-label">Min</label>
                <input class="field-input" type="number" [(ngModel)]="rule.rangeMin"
                       (ngModelChange)="onEdgeFieldChange()" />
              </div>
              <div class="field">
                <label class="field-label">Max</label>
                <input class="field-input" type="number" [(ngModel)]="rule.rangeMax"
                       (ngModelChange)="onEdgeFieldChange()" />
              </div>
            </div>
            <div class="condition-summary" *ngIf="rule.sourceNodeId">
              {{ conditionSummary(rule) }}
            </div>
          </div>

          <p class="conditions-hint" *ngIf="edgeRules.length === 0">
            No conditions — this is an unconditional route.
          </p>
        </div>

        <div class="meta-row">
          <span class="meta-label">Edge ID</span>
          <span class="meta-val">{{ selectedEdge.id }}</span>
        </div>
      </div>

    </aside>
  `,
  styles: [`
    .properties-panel {
      width: 248px; min-width: 248px; background: #fff;
      border-left: 1px solid #e5e7eb; display: flex; flex-direction: column;
      font-size: 12px; overflow-y: auto;
    }
    .panel-header {
      padding: 10px 14px; border-bottom: 1px solid #e5e7eb;
      display: flex; align-items: center; gap: 6px; flex-shrink: 0;
    }
    .panel-title-row { display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0; }
    .panel-title { font-size: 13px; font-weight: 600; color: #111827; }
    .type-badge {
      font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px;
      background: #f3f4f6; color: #6b7280;
    }
    .badge-assessment { background: #dbeafe; color: #3b82f6; }
    .badge-unit { background: #f0fdf4; color: #16a34a; }
    .badge-group { background: #ede9fe; color: #7c3aed; }
    .badge-start { background: #dcfce7; color: #166534; }
    .badge-end { background: #f3f4f6; color: #374151; }
    .badge-edge { background: #fef3c7; color: #92400e; }
    .delete-btn {
      width: 24px; height: 24px; border: none; background: transparent;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      color: #ef4444; border-radius: 4px; flex-shrink: 0;
    }
    .delete-btn:hover { background: #fef2f2; }

    .empty-state {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 24px; text-align: center; color: #9ca3af; gap: 12px;
    }
    .empty-state p { font-size: 11px; line-height: 1.6; margin: 0; }
    .empty-state strong { color: #374151; }

    .panel-body { padding: 12px; display: flex; flex-direction: column; gap: 10px; }

    .field { display: flex; flex-direction: column; gap: 4px; }
    .field-label { font-size: 11px; font-weight: 600; color: #374151; }
    .field-input, .field-textarea, .field-select {
      border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px 8px;
      font-size: 12px; color: #111827; background: #fff;
      outline: none; font-family: inherit; transition: border-color 0.15s;
      width: 100%; box-sizing: border-box;
    }
    .field-input:focus, .field-textarea:focus, .field-select:focus { border-color: #3b82f6; }
    .field-textarea { resize: vertical; }
    .field-row { display: flex; gap: 8px; }
    .field-row .field { flex: 1; min-width: 0; }
    .checkbox-row { display: flex; align-items: center; gap: 6px; cursor: pointer; }

    .section-group {
      background: #f9fafb; border-radius: 8px; padding: 10px;
      display: flex; flex-direction: column; gap: 8px;
    }
    .section-group-header { display: flex; align-items: center; justify-content: space-between; }
    .section-group-title {
      font-size: 10px; font-weight: 700; color: #374151;
      text-transform: uppercase; letter-spacing: 0.06em;
    }
    .add-btn {
      display: flex; align-items: center; gap: 3px; padding: 3px 8px;
      border: 1px solid #3b82f6; border-radius: 5px; background: transparent;
      color: #3b82f6; font-size: 11px; font-weight: 600; cursor: pointer;
    }
    .add-btn:hover { background: #eff6ff; }
    .conditions-hint { font-size: 10px; color: #9ca3af; margin: 0; }

    .condition-card {
      background: #fff; border: 1px solid #e5e7eb; border-radius: 7px;
      padding: 8px; display: flex; flex-direction: column; gap: 7px;
    }
    .condition-header { display: flex; align-items: center; justify-content: space-between; }
    .condition-title { font-size: 11px; font-weight: 600; color: #374151; }
    .remove-cond-btn {
      width: 18px; height: 18px; border: none; background: transparent;
      cursor: pointer; font-size: 14px; color: #9ca3af; border-radius: 3px;
      display: flex; align-items: center; justify-content: center;
    }
    .remove-cond-btn:hover { color: #ef4444; background: #fef2f2; }
    .condition-summary {
      font-size: 11px; color: #6b7280; background: #eff6ff;
      border-radius: 4px; padding: 4px 8px; border-left: 3px solid #3b82f6;
    }

    .connection-chip {
      background: #fff; border: 1px solid #e5e7eb; border-radius: 6px;
      padding: 6px 8px; display: flex; flex-direction: column; gap: 3px;
    }
    .chip-from { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #374151; }
    .chip-condition {
      font-size: 10px; color: #3b82f6; background: #eff6ff;
      padding: 2px 6px; border-radius: 3px; margin-left: 15px;
    }

    .connect-hint {
      display: flex; gap: 8px; padding: 8px 10px; background: #f0fdf4;
      border: 1px dashed #86efac; border-radius: 7px; font-size: 11px;
      color: #166534; line-height: 1.5;
    }
    .connect-hint strong { color: #15803d; }

    .edge-route {
      display: flex; align-items: center; gap: 6px;
      background: #f9fafb; border-radius: 8px; padding: 8px 10px;
    }
    .route-node {
      flex: 1; font-size: 11px; font-weight: 600; color: #111827;
      background: #fff; border: 1px solid #e5e7eb; border-radius: 5px;
      padding: 4px 7px; text-align: center; overflow: hidden;
      text-overflow: ellipsis; white-space: nowrap;
    }

    .meta-row {
      display: flex; gap: 8px; align-items: baseline;
      border-top: 1px solid #f3f4f6; padding-top: 8px;
    }
    .meta-label { font-size: 10px; font-weight: 600; color: #9ca3af; width: 70px; flex-shrink: 0; }
    .meta-val {
      font-size: 10px; color: #9ca3af; font-family: monospace;
      word-break: break-all; flex: 1;
    }
  `]
})
export class PropertiesPanelComponent implements OnChanges {
  @Input() selectedNode: PathNode | null = null;
  @Input() selectedEdge: PathEdge | null = null;
  @Input() allNodes:     PathNode[]      = [];
  @Input() allEdges:     PathEdge[]      = [];

  @Output() nodeUpdated  = new EventEmitter<Partial<PathNode>>();
  @Output() edgeUpdated  = new EventEmitter<PathEdge>();
  @Output() nodeDeleted  = new EventEmitter<string>();
  @Output() edgeDeleted  = new EventEmitter<string>();

  // Node form fields
  editLabel       = '';
  editDescription = '';
  editDuration    = 0;
  editDifficulty  = '';
  maxScore        = 100;
  passingScore    = 50;

  // Edge form fields
  edgeLabel     = '';
  edgePriority  = 1;
  edgeIsDefault = true;
  edgeRules: EdgeRule[] = [];

  // ── Derived getters ─────────────────────────────────────────────────────────

  get nodeTypeLabel(): string {
    const map: Record<string, string> = {
      start: 'Start', end: 'End', assessment: 'Assessment', unit: 'Unit', group: 'Group'
    };
    return map[this.selectedNode?.type || ''] || 'Node';
  }

  get assessmentNodes(): PathNode[] {
    return this.allNodes.filter(n => n.type === 'assessment');
  }

  get incomingEdges(): PathEdge[] {
    if (!this.selectedNode) return [];
    return this.allEdges.filter(e => e.targetNodeId === this.selectedNode!.id);
  }

  get outgoingEdges(): PathEdge[] {
    if (!this.selectedNode) return [];
    return this.allEdges.filter(e => e.sourceNodeId === this.selectedNode!.id);
  }

  getNodeLabel(nodeId: string): string {
    return this.allNodes.find(n => n.id === nodeId)?.label || nodeId;
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────
  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedNode'] && this.selectedNode) {
      this.loadNodeFields(this.selectedNode);
    }
    if (changes['selectedEdge'] && this.selectedEdge) {
      this.loadEdgeFields(this.selectedEdge);
    }
  }

  private loadNodeFields(node: PathNode) {
    this.editLabel       = node.label;
    this.editDescription = node.description || '';
    this.editDuration    = node.config?.approximateDurationMinutes || 0;
    this.maxScore        = node.config?.assessment?.maxScore   || 100;
    this.passingScore    = node.config?.assessment?.passingScore || 50;
    this.editDifficulty  = '';
  }

  private loadEdgeFields(edge: PathEdge) {
    this.edgeLabel     = edge.label || '';
    this.edgePriority  = edge.priority ?? 1;
    this.edgeIsDefault = edge.isDefault ?? true;
    // Map existing rules to form model
    this.edgeRules = (edge.conditions?.rules || []).map(r => ({
      id:           r.id,
      sourceNodeId: r.sourceNodeId,
      sourceType:   r.sourceType,
      metric:       r.metric,
      operator:     r.operator,
      value:        r.value !== undefined ? String(r.value) : '',
      rangeMin:     r.range?.min ?? 0,
      rangeMax:     r.range?.max ?? 100
    }));
  }

  // ── Node changes ────────────────────────────────────────────────────────────
  onNodeFieldChange() {
    if (!this.selectedNode) return;
    const config: any = {};
    if (this.editDuration) config.approximateDurationMinutes = this.editDuration;
    if (this.selectedNode.type === 'assessment') {
      config.assessment = { maxScore: this.maxScore, passingScore: this.passingScore };
    }
    this.nodeUpdated.emit({
      id: this.selectedNode.id,
      label: this.editLabel,
      description: this.editDescription,
      config
    });
  }

  onDeleteNode() {
    if (this.selectedNode) this.nodeDeleted.emit(this.selectedNode.id);
  }

  // ── Edge changes ────────────────────────────────────────────────────────────
  addEdgeCondition() {
    this.edgeRules = [...this.edgeRules, {
      id: 'r-' + Date.now(),
      sourceNodeId: '',
      sourceType: 'assessment',
      metric: 'score',
      operator: 'lt',
      value: '50',
      rangeMin: 0,
      rangeMax: 100
    }];
    this.onEdgeFieldChange();
  }

  removeEdgeCondition(i: number) {
    this.edgeRules = this.edgeRules.filter((_, idx) => idx !== i);
    this.onEdgeFieldChange();
  }

  onEdgeFieldChange() {
    if (!this.selectedEdge) return;
    const rules = this.edgeRules
      .filter(r => r.sourceNodeId)
      .map(r => {
        const base: any = {
          id: r.id,
          sourceType: r.sourceType,
          sourceNodeId: r.sourceNodeId,
          metric: r.metric,
          operator: r.metric === 'score_range' ? 'between' : r.operator
        };
        if (r.metric === 'score_range') {
          base.range = { min: r.rangeMin, max: r.rangeMax, minInclusive: true, maxInclusive: true };
        } else if (r.metric === 'passed' || r.metric === 'completion') {
          base.value = r.value === 'true' || r.value === true;
        } else {
          base.value = Number(r.value);
        }
        return base;
      });

    this.edgeUpdated.emit({
      ...this.selectedEdge,
      label:      this.edgeLabel,
      priority:   this.edgePriority,
      isDefault:  this.edgeIsDefault,
      conditions: { operator: 'AND', rules }
    });
  }

  onDeleteEdge() {
    if (this.selectedEdge) this.edgeDeleted.emit(this.selectedEdge.id);
  }

  conditionSummary(rule: EdgeRule): string {
    const src = this.getNodeLabel(rule.sourceNodeId);
    if (rule.metric === 'score_range')
      return `If ${src} score between ${rule.rangeMin} – ${rule.rangeMax}`;
    if (rule.metric === 'passed')
      return `If ${src} ${rule.value === 'true' ? 'passed' : 'failed'}`;
    const opMap: Record<string,string> = { lt:'<', lte:'≤', gt:'>', gte:'≥', eq:'=', ne:'≠' };
    return `If ${src} score ${opMap[rule.operator] || rule.operator} ${rule.value}`;
  }

  operatorLabel(op: string): string {
    const m: Record<string,string> = { lt:'<', lte:'≤', gt:'>', gte:'≥', eq:'=', ne:'≠' };
    return m[op] || op;
  }
}

interface EdgeRule {
  id:           string;
  sourceNodeId: string;
  sourceType:   string;
  metric:       string;
  operator:     string;
  value:        string | boolean | number;
  rangeMin:     number;
  rangeMax:     number;
}
