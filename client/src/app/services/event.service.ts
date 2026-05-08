import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Event, PaginatedResponse, ApiResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly apiUrl = `${environment.apiUrl}/events`;
  constructor(private http: HttpClient) {}

  list(params: { page?: number; limit?: number; search?: string; status?: string; orgId?: string } = {}) {
    const qp = new HttpParams({ fromObject: { ...params } as any });
    return this.http.get<ApiResponse<PaginatedResponse<Event>>>(this.apiUrl, { params: qp })
      .pipe(map(r => r.data!));
  }

  getById(id: string) {
    return this.http.get<ApiResponse<Event>>(`${this.apiUrl}/${id}`).pipe(map(r => r.data!));
  }

  create(data: Partial<Event>) {
    return this.http.post<ApiResponse<Event>>(this.apiUrl, data).pipe(map(r => r.data!));
  }

  update(id: string, data: Partial<Event>) {
    return this.http.put<ApiResponse<Event>>(`${this.apiUrl}/${id}`, data).pipe(map(r => r.data!));
  }

  delete(id: string) {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
