import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { OrganizationService } from '../../services/organization.service';
import { EventService } from '../../services/event.service';
import { MembershipService } from '../../services/membership.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { DashboardStats, Organization, Event, Membership } from '../../models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="section-title">
            Good {{ timeOfDay }}, <span class="gradient-text">{{ firstName }}</span> 👋
          </h1>
          <p class="text-gray-400 mt-1">Here's what's happening across your organizations.</p>
        </div>
        <div class="text-right text-sm text-gray-500">{{ today }}</div>
      </div>

      <!-- Admin stats -->
      @if (auth.isAdmin && stats()) {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
          @for (s of statCards; track s.label) {
            <div class="stat-card">
              <div class="flex items-center justify-between">
                <span class="text-gray-400 text-sm">{{ s.label }}</span>
                <div class="w-8 h-8 rounded-lg flex items-center justify-center" [style]="'background:' + s.bg">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" [style]="'color:' + s.color">
                    <path [attr.d]="s.icon"/>
                  </svg>
                </div>
              </div>
              <div class="font-display text-3xl font-bold text-white">{{ s.value }}</div>
              <div class="text-xs text-gray-500">{{ s.sub }}</div>
            </div>
          }
        </div>
      }

      <!-- My memberships + upcoming events -->
      <div class="grid lg:grid-cols-2 gap-6">

        <!-- My Organizations -->
        <div class="card p-6 animate-slide-up">
          <div class="flex items-center justify-between mb-5">
            <h2 class="font-display text-lg font-600 text-white">My Organizations</h2>
            <a routerLink="/organizations" class="text-brand-400 text-sm hover:text-brand-300 transition-colors">Browse all →</a>
          </div>

          @if (loadingMemberships()) {
            <div class="space-y-3">
              @for (i of [1,2,3]; track i) {
                <div class="flex items-center gap-3">
                  <div class="skeleton w-10 h-10 rounded-xl"></div>
                  <div class="flex-1 space-y-2">
                    <div class="skeleton h-3 w-32 rounded"></div>
                    <div class="skeleton h-2.5 w-20 rounded"></div>
                  </div>
                </div>
              }
            </div>
          } @else if (memberships().length === 0) {
            <div class="text-center py-8">
              <div class="text-gray-600 text-sm">You haven't joined any organizations yet.</div>
              <a routerLink="/organizations" class="btn-primary mt-4 inline-block text-sm">Browse Organizations</a>
            </div>
          } @else {
            <div class="space-y-3">
              @for (m of memberships(); track m.id) {
                <a [routerLink]="['/organizations', m.organization?.id]" class="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-elevated transition-colors group">
                  <div class="w-10 h-10 rounded-xl bg-brand-900 flex items-center justify-center text-brand-300 font-display font-600 text-sm shrink-0">
                    {{ m.organization?.name?.charAt(0) }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-white text-sm font-medium truncate group-hover:text-brand-300 transition-colors">{{ m.organization?.name }}</div>
                    <div class="text-gray-500 text-xs">{{ m.organization?.category }}</div>
                  </div>
                  <span [class]="statusBadge(m.status)">{{ m.status }}</span>
                </a>
              }
            </div>
          }
        </div>

        <!-- Upcoming Events -->
        <div class="card p-6 animate-slide-up">
          <div class="flex items-center justify-between mb-5">
            <h2 class="font-display text-lg font-600 text-white">Upcoming Events</h2>
            <a routerLink="/events" class="text-brand-400 text-sm hover:text-brand-300 transition-colors">View all →</a>
          </div>

          @if (loadingEvents()) {
            <div class="space-y-3">
              @for (i of [1,2,3]; track i) {
                <div class="skeleton h-20 rounded-xl"></div>
              }
            </div>
          } @else if (upcomingEvents().length === 0) {
            <div class="text-center py-8 text-gray-600 text-sm">No upcoming events.</div>
          } @else {
            <div class="space-y-3">
              @for (evt of upcomingEvents(); track evt.id) {
                <a [routerLink]="['/events']" class="block p-4 rounded-xl bg-surface-elevated hover:bg-surface-border transition-colors border border-surface-border group">
                  <div class="flex items-start gap-3">
                    <div class="text-center shrink-0 w-10">
                      <div class="text-xs text-gray-500 uppercase">{{ formatMonth(evt.startDate) }}</div>
                      <div class="font-display text-xl font-bold text-brand-400 leading-none">{{ formatDay(evt.startDate) }}</div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-white text-sm font-medium truncate group-hover:text-brand-300 transition-colors">{{ evt.title }}</div>
                      <div class="text-gray-500 text-xs mt-0.5">{{ evt.organization?.name }}</div>
                      @if (evt.location) {
                        <div class="text-gray-600 text-xs mt-0.5">📍 {{ evt.location }}</div>
                      }
                    </div>
                  </div>
                </a>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  stats = signal<DashboardStats | null>(null);
  memberships = signal<Membership[]>([]);
  upcomingEvents = signal<Event[]>([]);
  loadingMemberships = signal(true);
  loadingEvents = signal(true);

  get firstName() { return this.auth.currentUser?.firstName || ''; }
  get timeOfDay() { const h = new Date().getHours(); return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'; }
  get today() { return new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); }

  get statCards() {
    const s = this.stats();
    if (!s) return [];
    return [
      { label: 'Total Users', value: s.users, sub: 'Registered students', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', bg: 'rgba(99,102,241,0.15)', color: '#818cf8' },
      { label: 'Organizations', value: s.organizations, sub: 'Active orgs', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', bg: 'rgba(249,115,22,0.15)', color: '#fb923c' },
      { label: 'Events', value: s.events, sub: 'Total events', icon: 'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', bg: 'rgba(16,185,129,0.15)', color: '#34d399' },
      { label: 'Pending', value: s.pendingMemberships, sub: 'Awaiting approval', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
    ];
  }

  constructor(public auth: AuthService, private membershipSvc: MembershipService, private eventSvc: EventService, private http: HttpClient) {}

  ngOnInit() {
    if (this.auth.isAdmin) {
      this.http.get<{ success: boolean; data: DashboardStats }>(`${environment.apiUrl}/users/stats`).subscribe(r => this.stats.set(r.data));
    }
    this.membershipSvc.myMemberships().subscribe({ next: m => { this.memberships.set(m); this.loadingMemberships.set(false); }, error: () => this.loadingMemberships.set(false) });
    this.eventSvc.list({ status: 'UPCOMING', limit: 4 }).subscribe({ next: r => { this.upcomingEvents.set(r.data); this.loadingEvents.set(false); }, error: () => this.loadingEvents.set(false) });
  }

  statusBadge(status: string) {
    const map: Record<string, string> = { APPROVED: 'badge-success', PENDING: 'badge-warning', REJECTED: 'badge-danger' };
    return map[status] || 'badge-gray';
  }

  formatMonth(date: string) { return new Date(date).toLocaleDateString('en', { month: 'short' }); }
  formatDay(date: string) { return new Date(date).getDate(); }
}
