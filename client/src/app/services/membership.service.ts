import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Membership, ApiResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class MembershipService {
  private readonly apiUrl = `${environment.apiUrl}/memberships`;
  constructor(private http: HttpClient) {}

  join(orgId: string) {
    return this.http.post<ApiResponse<Membership>>(`${this.apiUrl}/join/${orgId}`, {});
  }

  leave(orgId: string) {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/leave/${orgId}`);
  }

  myMemberships() {
    return this.http.get<ApiResponse<Membership[]>>(`${this.apiUrl}/my`).pipe(map(r => r.data!));
  }

  approve(id: string) {
    return this.http.patch<ApiResponse<Membership>>(`${this.apiUrl}/${id}/approve`, {});
  }

  reject(id: string) {
    return this.http.patch<ApiResponse<Membership>>(`${this.apiUrl}/${id}/reject`, {});
  }
}
