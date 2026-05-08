import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MembershipService } from '../../services/membership.service';
import { Membership } from '../../models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="space-y-6 max-w-2xl">
      <!-- Header -->
      <div>
        <h1 class="section-title">Profile</h1>
        <p class="text-gray-400 mt-1">Manage your account information</p>
      </div>

      <!-- Profile card -->
      <div class="card p-8 animate-slide-up">
        <div class="flex items-center gap-6 mb-8">
          <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white font-display text-3xl font-bold shadow-glow-sm shrink-0">
            {{ initials }}
          </div>
          <div>
            <h2 class="font-display text-2xl font-bold text-white">{{ fullName }}</h2>
            <p class="text-gray-400">{{ user?.email }}</p>
            <div class="flex items-center gap-2 mt-2">
              <span [class]="user?.role === 'ADMIN' ? 'badge-brand' : 'badge-gray'">{{ user?.role }}</span>
              @if (user?.studentId) {
                <span class="text-gray-500 text-xs">ID: {{ user?.studentId }}</span>
              }
            </div>
          </div>
        </div>

        <div class="border-t border-surface-border pt-6">
          <h3 class="font-display font-600 text-white mb-4">Account Details</h3>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div class="text-gray-500 text-xs mb-1">First Name</div>
              <div class="text-white">{{ user?.firstName }}</div>
            </div>
            <div>
              <div class="text-gray-500 text-xs mb-1">Last Name</div>
              <div class="text-white">{{ user?.lastName }}</div>
            </div>
            <div>
              <div class="text-gray-500 text-xs mb-1">Email</div>
              <div class="text-white">{{ user?.email }}</div>
            </div>
            <div>
              <div class="text-gray-500 text-xs mb-1">Member Since</div>
              <div class="text-white">{{ formatDate(user?.createdAt || '') }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- My Organizations -->
      <div class="card p-6 animate-slide-up">
        <h3 class="font-display font-600 text-white mb-5">My Organizations</h3>

        @if (loadingMemberships()) {
          <div class="space-y-3">
            @for (i of [1,2,3]; track i) { <div class="skeleton h-14 rounded-xl"></div> }
          </div>
        } @else if (memberships().length === 0) {
          <div class="text-center py-8">
            <p class="text-gray-500 text-sm mb-4">You haven't joined any organizations yet.</p>
            <a routerLink="/organizations" class="btn-primary text-sm">Browse Organizations</a>
          </div>
        } @else {
          <div class="space-y-2">
            @for (m of memberships(); track m.id) {
              <div class="flex items-center gap-4 p-3 rounded-xl bg-surface-elevated">
                <div class="w-10 h-10 rounded-xl bg-brand-900 flex items-center justify-center text-brand-300 font-display font-600 text-sm shrink-0">
                  {{ m.organization?.name?.charAt(0) }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-white text-sm font-medium truncate">{{ m.organization?.name }}</div>
                  <div class="text-gray-500 text-xs">{{ m.organization?.category }}</div>
                </div>
                <div class="flex items-center gap-2">
                  <span [class]="statusBadge(m.status)">{{ m.status }}</span>
                  @if (m.status === 'APPROVED') {
                    <button (click)="leave(m.organizationId)" class="text-red-400 hover:text-red-300 text-xs transition-colors">Leave</button>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Danger zone -->
      <div class="card p-6 border-red-900/30 animate-slide-up">
        <h3 class="font-display font-600 text-red-400 mb-4">Account Actions</h3>
        <button (click)="auth.logout()" class="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign out of your account
        </button>
      </div>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  memberships = signal<Membership[]>([]);
  loadingMemberships = signal(true);

  get user() { return this.auth.currentUser; }
  get fullName() { return `${this.user?.firstName} ${this.user?.lastName}`; }
  get initials() { return `${this.user?.firstName?.charAt(0)}${this.user?.lastName?.charAt(0)}`.toUpperCase(); }

  constructor(public auth: AuthService, private membershipSvc: MembershipService) {}

  ngOnInit() {
    this.membershipSvc.myMemberships().subscribe({ next: m => { this.memberships.set(m); this.loadingMemberships.set(false); }, error: () => this.loadingMemberships.set(false) });
  }

  leave(orgId: string) {
    if (!confirm('Leave this organization?')) return;
    this.membershipSvc.leave(orgId).subscribe({ next: () => this.memberships.update(ms => ms.filter(m => m.organizationId !== orgId)), error: (e) => alert(e.error?.message) });
  }

  statusBadge(s: string) { return { APPROVED: 'badge-success', PENDING: 'badge-warning', REJECTED: 'badge-danger' }[s] || 'badge-gray'; }
  formatDate(d: string) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }); }
}
