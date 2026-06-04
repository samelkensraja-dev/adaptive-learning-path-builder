export interface Position { x: number; y: number; }

export interface NodeConfig {
  approximateDurationMinutes?: number;
  assessment?: { maxScore: number; passingScore: number };
}

export interface Rule {
  id: string;
  sourceType: 'assessment' | 'unit';
  sourceNodeId: string;
  metric: string;
  operator: string;
  value?: boolean | number | string;
  range?: { min: number; max: number; minInclusive?: boolean; maxInclusive?: boolean };
}

export interface Conditions {
  operator: 'AND' | 'OR';
  rules: Rule[];
}

export interface PathEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string;
  priority?: number;
  isDefault?: boolean;
  conditions: Conditions;
}

export type NodeType = 'start' | 'unit' | 'assessment' | 'end' | 'group';

export interface PathNode {
  id: string;
  componentId: string;
  type: NodeType;
  label: string;
  description?: string;
  position: Position;
  config?: NodeConfig;
  selected?: boolean;
}

export interface CanvasState {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export interface LearningPath {
  id?: string;
  name: string;
  description?: string;
  status: 'draft' | 'published';
  version?: number;
  canvas?: CanvasState;
  nodes: PathNode[];
  edges: PathEdge[];
}
