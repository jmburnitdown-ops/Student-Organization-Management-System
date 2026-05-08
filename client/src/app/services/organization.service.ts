import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Organization, PaginatedResponse, ApiResponse, Membership } from '../models';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private readonly apiUrl = `${environment.apiUrl}/organizations`;
  constructor(private http: HttpClient) {}

  list(params: { page?: number; limit?: number; search?: string; category?: string } = {}) {
    const qp = new HttpParams({ fromObject: { ...params } as any });
    return this.http.get<ApiResponse<PaginatedResponse<Organization>>>(this.apiUrl, { params: qp })
      .pipe(map(r => r.data!));
  }

  getById(id: string) {
    return this.http.get<ApiResponse<Organization>>(`${this.apiUrl}/${id}`)
      .pipe(map(r => r.data!));
  }

  create(data: Partial<Organization>) {
    return this.http.post<ApiResponse<Organization>>(this.apiUrl, data).pipe(map(r => r.data!));
  }

  update(id: string, data: Partial<Organization>) {
    return this.http.put<ApiResponse<Organization>>(`${this.apiUrl}/${id}`, data).pipe(map(r => r.data!));
  }

  delete(id: string) {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  getMembers(orgId: string, params: { status?: string; page?: number; limit?: number } = {}) {
    const qp = new HttpParams({ fromObject: { ...params } as any });
    return this.http.get<ApiResponse<PaginatedResponse<Membership>>>(`${this.apiUrl}/${orgId}/members`, { params: qp })
      .pipe(map(r => r.data!));
  }
}
