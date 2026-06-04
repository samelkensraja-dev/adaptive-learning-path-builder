import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="app-header">
      <div class="header-left">
        <h1 class="app-title">Adaptive Learning Path Builder</h1>
        <p class="app-subtitle">Create conditional quiz flows with adaptive sections</p>
      </div>
      <div class="header-center">
        <div class="tab-group">
          <button class="tab-btn" [class.active]="activeTab === 'builder'" (click)="setTab('builder')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            Builder
          </button>
          <button class="tab-btn" [class.active]="activeTab === 'preview'" (click)="setTab('preview')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Preview
          </button>
        </div>
      </div>
      <div class="header-right">
        <button class="btn-outline" (click)="onSaveDraft()">Save Draft</button>
        <button class="btn-publish" (click)="onPublish()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Publish
        </button>
      </div>
    </header>
  `,
  styles: [`
    .app-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 20px;
      background: #fff;
      border-bottom: 1px solid #e5e7eb;
      height: 60px;
      flex-shrink: 0;
    }
    .header-left { display: flex; flex-direction: column; gap: 1px; }
    .app-title { font-size: 14px; font-weight: 600; color: #111827; margin: 0; }
    .app-subtitle { font-size: 11px; color: #6b7280; margin: 0; }
    .header-center { display: flex; align-items: center; }
    .tab-group { display: flex; background: #f3f4f6; border-radius: 8px; padding: 3px; gap: 2px; }
    .tab-btn {
      display: flex; align-items: center; gap: 5px;
      padding: 6px 14px; border: none; background: transparent;
      border-radius: 6px; font-size: 13px; font-weight: 500;
      color: #6b7280; cursor: pointer; transition: all 0.15s;
    }
    .tab-btn.active { background: #fff; color: #111827; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header-right { display: flex; align-items: center; gap: 8px; }
    .btn-outline {
      padding: 7px 16px; border: 1px solid #d1d5db; background: #fff;
      border-radius: 7px; font-size: 13px; font-weight: 500; color: #374151;
      cursor: pointer; transition: all 0.15s;
    }
    .btn-outline:hover { background: #f9fafb; }
    .btn-publish {
      display: flex; align-items: center; gap: 5px;
      padding: 7px 16px; border: none; background: #16a34a;
      border-radius: 7px; font-size: 13px; font-weight: 500; color: #fff;
      cursor: pointer; transition: all 0.15s;
    }
    .btn-publish:hover { background: #15803d; }
  `]
})
export class HeaderComponent {
  @Input() activeTab: 'builder' | 'preview' = 'builder';
  @Output() tabChange = new EventEmitter<'builder' | 'preview'>();
  @Output() saveDraft = new EventEmitter<void>();
  @Output() publish = new EventEmitter<void>();

  setTab(tab: 'builder' | 'preview') {
    this.activeTab = tab;
    this.tabChange.emit(tab);
  }
  onSaveDraft() { this.saveDraft.emit(); }
  onPublish() { this.publish.emit(); }
}
