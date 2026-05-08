import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { User, DashboardStats, PaginatedResponse, ApiResponse } from '../../models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div>
        <h1 class="section-title">Admin Panel</h1>
        <p class="text-gray-400 mt-1">System overview and user management</p>
      </div>

      <!-- Stats -->
      @if (stats()) {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
          @for (s of statCards; track s.label) {
            <div class="stat-card">
              <div class="flex items-center justify-between">
                <span class="text-gray-400 text-sm">{{ s.label }}</span>
                <div class="w-9 h-9 rounded-xl flex items-center justify-center text-lg" [style]="'background:' + s.bg">{{ s.icon }}</div>
              </div>
              <div class="font-display text-3xl font-bold text-white">{{ s.value }}</div>
            </div>
          }
        </div>
      }

      <!-- Users table -->
      <div class="card p-6 animate-slide-up">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 class="font-display text-lg font-600 text-white">All Users</h2>
          <div class="relative max-w-xs">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input [(ngModel)]="search" (ngModelChange)="loadUsers()" type="text" placeholder="Search users..." class="input-field pl-9 text-sm" />
          </div>
        </div>

        @if (loadingUsers()) {
          <div class="space-y-3">
            @for (i of [1,2,3,4,5]; track i) { <div class="skeleton h-14 rounded-xl"></div> }
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-gray-500 text-xs uppercase tracking-wider border-b border-surface-border">
                  <th class="pb-3 pr-4 font-medium">User</th>
                  <th class="pb-3 pr-4 font-medium">Student ID</th>
                  <th class="pb-3 pr-4 font-medium">Role</th>
                  <th class="pb-3 pr-4 font-medium">Orgs</th>
                  <th class="pb-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                @for (u of users(); track u.id) {
                  <tr class="table-row">
                    <td class="py-3 pr-4">
                      <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-full bg-brand-900 flex items-center justify-center text-brand-300 text-xs font-600 shrink-0 font-display">
                          {{ u.firstName.charAt(0) }}{{ u.lastName.charAt(0) }}
                        </div>
                        <div>
                          <div class="text-white font-medium">{{ u.firstName }} {{ u.lastName }}</div>
                          <div class="text-gray-500 text-xs">{{ u.email }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="py-3 pr-4 text-gray-400">{{ u.studentId || '—' }}</td>
                    <td class="py-3 pr-4">
                      <span [class]="u.role === 'ADMIN' ? 'badge-brand' : 'badge-gray'">{{ u.role }}</span>
                    </td>
                    <td class="py-3 pr-4 text-gray-400">{{ u._count?.memberships || 0 }}</td>
                    <td class="py-3 text-gray-500">{{ formatDate(u.createdAt) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (meta()?.totalPages! > 1) {
            <div class="flex justify-center gap-2 mt-4">
              <button (click)="goPage(page - 1)" [disabled]="!meta()?.hasPrev" class="btn-secondary text-sm px-4 py-2">← Prev</button>
              <span class="flex items-center text-gray-400 text-sm px-4">{{ page }} / {{ meta()?.totalPages }}</span>
              <button (click)="goPage(page + 1)" [disabled]="!meta()?.hasNext" class="btn-secondary text-sm px-4 py-2">Next →</button>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class AdminComponent implements OnInit {
  stats = signal<DashboardStats | null>(null);
  users = signal<User[]>([]);
  meta = signal<any>(null);
  loadingUsers = signal(true);
  search = '';
  page = 1;

  get statCards() {
    const s = this.stats();
    if (!s) return [];
    return [
      { label: 'Total Users', value: s.users, icon: '👥', bg: 'rgba(99,102,241,0.15)' },
      { label: 'Organizations', value: s.organizations, icon: '🏛️', bg: 'rgba(249,115,22,0.15)' },
      { label: 'Events', value: s.events, icon: '📅', bg: 'rgba(16,185,129,0.15)' },
      { label: 'Pending Requests', value: s.pendingMemberships, icon: '⏳', bg: 'rgba(245,158,11,0.15)' },
    ];
  }

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<ApiResponse<DashboardStats>>(`${environment.apiUrl}/users/stats`).subscribe(r => this.stats.set(r.data!));
    this.loadUsers();
  }

  loadUsers() {
    this.loadingUsers.set(true);
    const params: any = { page: this.page, limit: 10 };
    if (this.search) params.search = this.search;
    const qp = new URLSearchParams(params).toString();
    this.http.get<ApiResponse<PaginatedResponse<User>>>(`${environment.apiUrl}/users?${qp}`).subscribe({
      next: r => { this.users.set(r.data!.data); this.meta.set(r.data!.meta); this.loadingUsers.set(false); },
      error: () => this.loadingUsers.set(false),
    });
  }

  goPage(p: number) { this.page = p; this.loadUsers(); }
  formatDate(d: string) { return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }); }
}
