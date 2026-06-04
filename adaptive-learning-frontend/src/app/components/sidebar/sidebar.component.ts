import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ComponentService } from '../../services/component.service';
import { AvailableComponent } from '../../models/component.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <aside class="sidebar">
      <div class="sidebar-section">
        <h2 class="sidebar-title">Add Components</h2>
        <p class="sidebar-hint">Drag or click to add to canvas</p>
        <div class="component-tiles">
          <div class="tile tile-section"
               draggable="true"
               (dragstart)="onDragStart($event, 'assessment')">
            <div class="tile-icon tile-icon-blue">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
            </div>
            <div class="tile-info">
              <span class="tile-name">Section</span>
              <span class="tile-desc">Add a quiz/assessment section</span>
            </div>
          </div>
          <div class="tile tile-group"
               draggable="true"
               (dragstart)="onDragStart($event, 'group')">
            <div class="tile-icon tile-icon-purple">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
              </svg>
            </div>
            <div class="tile-info">
              <span class="tile-name">Group</span>
              <span class="tile-desc">Group sections for conditional routing</span>
            </div>
          </div>
        </div>
      </div>

      <div class="info-box">
        <div class="info-header" (click)="infoExpanded = !infoExpanded">
          <svg class="bulb-icon" width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
            <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z"/>
          </svg>
          <span class="info-title">How it works:</span>
          <svg class="chevron" [class.expanded]="infoExpanded" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
        <div class="info-content" *ngIf="infoExpanded">
          <ul class="info-list">
            <li><strong>Sections</strong> are individual modules</li>
            <li><strong>Groups</strong> hold multiple sections where only one will be shown</li>
            <li>Set conditions based on previous section scores</li>
            <li>The system automatically routes learners based on performance</li>
          </ul>
        </div>
      </div>

      <div class="example-section">
        <h3 class="example-title">Example: SAT Adaptive Test</h3>
        <div class="example-item">
          <span class="example-label">Math Module 1</span>
          <span class="example-type">Regular section</span>
        </div>
        <div class="example-group">
          <div class="example-group-header">Math Module 2 (Group)</div>
          <div class="example-branches">
            <div class="branch easy">
              <span class="branch-name">Easy Version</span>
              <span class="branch-cond">If score &lt; 50%</span>
            </div>
            <div class="branch advanced">
              <span class="branch-name">Advanced</span>
              <span class="branch-cond">If score ≥ 50%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="available-content" *ngIf="components.length > 0">
        <h3 class="available-title">Available Content</h3>
        <div class="component-list">
          <div *ngFor="let c of components"
               class="comp-item"
               [class.comp-assessment]="c.type === 'assessment'"
               [class.comp-unit]="c.type === 'unit'"
               draggable="true"
               (dragstart)="onDragStartComponent($event, c)">
            <div class="comp-icon">
              <svg *ngIf="c.type === 'assessment'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
              <svg *ngIf="c.type === 'unit'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="2" width="18" height="20" rx="2"/>
                <line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/>
              </svg>
            </div>
            <div class="comp-info">
              <span class="comp-title">{{ c.title }}</span>
              <span class="comp-meta">{{ c.approximateDurationMinutes }} min</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 200px; min-width: 200px; background: #fff; border-right: 1px solid #e5e7eb;
      display: flex; flex-direction: column; gap: 0; overflow-y: auto; font-size: 12px;
    }
    .sidebar-section { padding: 14px 12px 10px; border-bottom: 1px solid #f3f4f6; }
    .sidebar-title { font-size: 13px; font-weight: 600; color: #111827; margin: 0 0 2px; }
    .sidebar-hint { font-size: 11px; color: #9ca3af; margin: 0 0 10px; }
    .component-tiles { display: flex; flex-direction: column; gap: 6px; }
    .tile {
      display: flex; align-items: center; gap: 8px; padding: 8px 10px;
      border: 1px solid #e5e7eb; border-radius: 8px; cursor: grab;
      transition: all 0.15s; background: #fafafa;
    }
    .tile:hover { border-color: #3b82f6; background: #eff6ff; }
    .tile-icon {
      width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .tile-icon-blue { background: #dbeafe; color: #3b82f6; }
    .tile-icon-purple { background: #ede9fe; color: #7c3aed; }
    .tile-info { display: flex; flex-direction: column; gap: 1px; }
    .tile-name { font-size: 12px; font-weight: 600; color: #111827; }
    .tile-desc { font-size: 10px; color: #6b7280; }

    .info-box { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; }
    .info-header { display: flex; align-items: center; gap: 5px; cursor: pointer; user-select: none; }
    .info-title { font-size: 11px; font-weight: 600; color: #92400e; flex: 1; }
    .bulb-icon { flex-shrink: 0; }
    .chevron { transition: transform 0.2s; color: #6b7280; }
    .chevron.expanded { transform: rotate(180deg); }
    .info-content { margin-top: 6px; }
    .info-list { margin: 0; padding-left: 14px; color: #374151; line-height: 1.6; }
    .info-list li { margin-bottom: 3px; }

    .example-section { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; }
    .example-title { font-size: 11px; font-weight: 600; color: #374151; margin: 0 0 6px; }
    .example-item { margin-bottom: 4px; }
    .example-label { font-size: 11px; font-weight: 500; color: #111827; display: block; }
    .example-type { font-size: 10px; color: #9ca3af; }
    .example-group { background: #f5f3ff; border: 1px dashed #a78bfa; border-radius: 6px; padding: 6px 8px; margin-top: 4px; }
    .example-group-header { font-size: 11px; font-weight: 600; color: #7c3aed; margin-bottom: 5px; }
    .example-branches { display: flex; flex-direction: column; gap: 4px; }
    .branch { background: #fff; border-radius: 4px; padding: 4px 6px; border: 1px solid #e5e7eb; }
    .branch.easy { border-left: 3px solid #3b82f6; }
    .branch.advanced { border-left: 3px solid #8b5cf6; }
    .branch-name { display: block; font-size: 10px; font-weight: 600; color: #111827; }
    .branch-cond { font-size: 10px; color: #6b7280; }

    .available-content { padding: 10px 12px; }
    .available-title { font-size: 11px; font-weight: 600; color: #374151; margin: 0 0 6px; }
    .component-list { display: flex; flex-direction: column; gap: 4px; }
    .comp-item {
      display: flex; align-items: center; gap: 6px; padding: 6px 8px;
      border-radius: 6px; cursor: grab; border: 1px solid transparent; transition: all 0.15s;
    }
    .comp-item:hover { background: #f9fafb; border-color: #e5e7eb; }
    .comp-assessment .comp-icon { color: #3b82f6; }
    .comp-unit .comp-icon { color: #6b7280; }
    .comp-icon { width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .comp-info { display: flex; flex-direction: column; }
    .comp-title { font-size: 11px; font-weight: 500; color: #111827; }
    .comp-meta { font-size: 10px; color: #9ca3af; }
  `]
})
export class SidebarComponent implements OnInit, OnDestroy {
  components: AvailableComponent[] = [];
  infoExpanded = true;
  // CHANGED: CS-2 — subscription tracked for cleanup in ngOnDestroy
  private sub?: Subscription;

  constructor(private componentService: ComponentService) {}

  ngOnInit() {
    this.sub = this.componentService.getAll().subscribe({
      next: (res) => { this.components = res.items; },
      error: () => { this.components = []; }
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); } // CHANGED: CS-2 — prevent memory leak

  onDragStart(event: DragEvent, type: string) {
    event.dataTransfer?.setData('nodeType', type);
    event.dataTransfer?.setData('componentId', 'system-' + type);
    event.dataTransfer?.setData('label', type === 'assessment' ? 'New Section' : 'New Group');
  }

  onDragStartComponent(event: DragEvent, component: AvailableComponent) {
    event.dataTransfer?.setData('nodeType', component.type);
    event.dataTransfer?.setData('componentId', component.id);
    event.dataTransfer?.setData('label', component.title);
    event.dataTransfer?.setData('duration', String(component.approximateDurationMinutes));
    if (component.metadata?.assessment) {
      event.dataTransfer?.setData('meta', JSON.stringify(component.metadata.assessment));
    }
  }
}
