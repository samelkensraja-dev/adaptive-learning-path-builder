import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ComponentsResponse } from '../models/component.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ComponentService {
  // CHANGED: F-03 — URL sourced from environment config
  private readonly base = `${environment.apiBaseUrl}/components`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ComponentsResponse> {
    return this.http.get<ComponentsResponse>(this.base);
  }
}
