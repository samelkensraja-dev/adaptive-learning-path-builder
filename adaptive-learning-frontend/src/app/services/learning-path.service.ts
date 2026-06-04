import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LearningPath } from '../models/learning-path.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LearningPathService {
  // CHANGED: F-03 — URL sourced from environment, not hardcoded
  private readonly base = `${environment.apiBaseUrl}/learning-paths`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<LearningPath[]> {
    return this.http.get<LearningPath[]>(this.base);
  }

  getById(id: string): Observable<LearningPath> {
    return this.http.get<LearningPath>(`${this.base}/${id}`);
  }

  create(lp: LearningPath): Observable<LearningPath> {
    return this.http.post<LearningPath>(this.base, lp);
  }

  update(id: string, lp: LearningPath): Observable<LearningPath> {
    return this.http.put<LearningPath>(`${this.base}/${id}`, lp);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
