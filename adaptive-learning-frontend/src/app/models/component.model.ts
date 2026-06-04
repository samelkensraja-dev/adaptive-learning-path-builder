export interface ComponentMetadata {
  assessment?: { maxScore: number; passingScore: number };
  unit?: { recommendedMinutes: number };
}

export interface AvailableComponent {
  id: string;
  title: string;
  shortDescription: string;
  type: 'unit' | 'assessment';
  approximateDurationMinutes: number;
  metadata?: ComponentMetadata;
}

export interface ComponentsResponse {
  items: AvailableComponent[];
  totalCount: number;
}
