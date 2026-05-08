import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Document, PaginatedResponse, ApiResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly apiUrl = `${environment.apiUrl}/documents`;
  constructor(private http: HttpClient) {}

  list(params: { page?: number; limit?: number; search?: string; orgId?: string } = {}) {
    const qp = new HttpParams({ fromObject: { ...params } as any });
    return this.http.get<ApiResponse<PaginatedResponse<Document>>>(this.apiUrl, { params: qp })
      .pipe(map(r => r.data!));
  }

  upload(file: File, title: string, description?: string, organizationId?: string, isPublic = false) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    if (description) formData.append('description', description);
    if (organizationId) formData.append('organizationId', organizationId);
    formData.append('isPublic', String(isPublic));
    return this.http.post<ApiResponse<Document>>(`${this.apiUrl}/upload`, formData);
  }

  delete(id: string) {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
