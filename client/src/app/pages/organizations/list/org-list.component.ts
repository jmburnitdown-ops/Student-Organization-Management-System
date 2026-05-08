import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { OrganizationService } from '../../../services/organization.service';
import { MembershipService } from '../../../services/membership.service';
import { AuthService } from '../../../services/auth.service';
import { Organization, PaginatedResponse } from '../../../models';

const CATEGORIES = ['All', 'Academic', 'Cultural', 'Sports', 'Religious', 'Civic', 'Technology', 'Arts', 'Other'];

@Component({
  selector: 'app-org-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="section-title">Organizations</h1>
          <p class="text-gray-400 mt-1">Discover and join student organizations</p>
        </div>
        @if (auth.isAdmin) {
          <button (click)="showCreate = true" class="btn-primary flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Organization
          </button>
        }
      </div>

      <!-- Filters -->
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1 max-w-xs">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input [(ngModel)]="searchQuery" (ngModelChange)="onSearch($event)" type="text" placeholder="Search organizations..."
            class="input-field pl-9 text-sm" />
        </div>
        <div class="flex gap-2 flex-wrap">
          @for (cat of categories; track cat) {
            <button (click)="selectCategory(cat)" class="px-3 py-1.5 rounded-lg text-sm transition-all duration-150 border"
              [class]="activeCategory === cat ? 'bg-brand-600 text-white border-brand-600' : 'bg-surface-elevated text-gray-400 border-surface-border hover:text-white hover:border-gray-600'">
              {{ cat }}
            </button>
          }
        </div>
      </div>

      <!-- Grid -->
      @if (loading()) {
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="card p-6 space-y-3">
              <div class="skeleton h-12 w-12 rounded-xl"></div>
              <div class="skeleton h-4 w-3/4 rounded"></div>
              <div class="skeleton h-3 w-full rounded"></div>
              <div class="skeleton h-3 w-2/3 rounded"></div>
            </div>
          }
        </div>
      } @else if (result()?.data?.length === 0) {
        <div class="text-center py-16 text-gray-500">
          <svg class="w-12 h-12 mx-auto mb-4 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <p>No organizations found</p>
        </div>
      } @else {
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          @for (org of result()?.data; track org.id) {
            <div class="card p-6 hover:border-brand-700/50 transition-all duration-200 group flex flex-col gap-4">
              <div class="flex items-start justify-between">
                <div class="w-12 h-12 rounded-xl bg-brand-900 flex items-center justify-center text-brand-300 font-display text-xl font-bold shrink-0">
                  {{ org.name.charAt(0) }}
                </div>
                <span class="badge-brand text-xs">{{ org.category }}</span>
              </div>

              <div class="flex-1">
                <h3 class="font-display font-600 text-white group-hover:text-brand-300 transition-colors leading-tight">{{ org.name }}</h3>
                <p class="text-gray-500 text-sm mt-1 line-clamp-2">{{ org.description || 'No description available.' }}</p>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-surface-border">
                <div class="flex items-center gap-1 text-gray-500 text-xs">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  {{ org._count?.memberships || 0 }} members
                </div>
                <div class="flex gap-2">
                  <a [routerLink]="['/organizations', org.id]" class="btn-ghost text-xs px-3 py-1.5">View</a>
                  <button (click)="join(org.id)" class="btn-primary text-xs px-3 py-1.5"
                    [disabled]="joiningId === org.id">
                    {{ joiningId === org.id ? '...' : 'Join' }}
                  </button>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Pagination -->
        @if (result()?.meta?.totalPages! > 1) {
          <div class="flex justify-center gap-2 mt-4">
            <button (click)="goPage(currentPage - 1)" [disabled]="!result()?.meta?.hasPrev" class="btn-secondary text-sm px-4 py-2">← Prev</button>
            <span class="flex items-center text-gray-400 text-sm px-4">{{ currentPage }} / {{ result()?.meta?.totalPages }}</span>
            <button (click)="goPage(currentPage + 1)" [disabled]="!result()?.meta?.hasNext" class="btn-secondary text-sm px-4 py-2">Next →</button>
          </div>
        }
      }
    </div>

    <!-- Create Modal -->
    @if (showCreate && auth.isAdmin) {
      <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="card w-full max-w-md p-8 animate-slide-up">
          <h2 class="font-display text-xl font-600 text-white mb-6">New Organization</h2>
          <div class="space-y-4">
            <input [(ngModel)]="newOrg.name" placeholder="Organization name" class="input-field" />
            <select [(ngModel)]="newOrg.category" class="input-field">
              @for (c of categories.slice(1); track c) { <option [value]="c">{{ c }}</option> }
            </select>
            <textarea [(ngModel)]="newOrg.description" placeholder="Description (optional)" class="input-field h-24 resize-none"></textarea>
          </div>
          <div class="flex gap-3 mt-6">
            <button (click)="showCreate = false" class="btn-secondary flex-1">Cancel</button>
            <button (click)="createOrg()" class="btn-primary flex-1">Create</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class OrgListComponent implements OnInit {
  result = signal<PaginatedResponse<Organization> | null>(null);
  loading = signal(true);
  categories = CATEGORIES;
  activeCategory = 'All';
  searchQuery = '';
  currentPage = 1;
  joiningId = '';
  showCreate = false;
  newOrg = { name: '', category: 'Academic', description: '' };
  private search$ = new Subject<string>();

  constructor(private orgSvc: OrganizationService, private membershipSvc: MembershipService, public auth: AuthService) {}

  ngOnInit() {
    this.load();
    this.search$.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => { this.currentPage = 1; this.load(); });
  }

  load() {
    this.loading.set(true);
    const params: any = { page: this.currentPage, limit: 9 };
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.activeCategory !== 'All') params.category = this.activeCategory;
    this.orgSvc.list(params).subscribe({ next: r => { this.result.set(r); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  onSearch(val: string) { this.search$.next(val); }
  selectCategory(cat: string) { this.activeCategory = cat; this.currentPage = 1; this.load(); }
  goPage(p: number) { this.currentPage = p; this.load(); }

  join(orgId: string) {
    this.joiningId = orgId;
    this.membershipSvc.join(orgId).subscribe({ next: () => { this.joiningId = ''; alert('Join request submitted!'); }, error: (e) => { this.joiningId = ''; alert(e.error?.message || 'Error'); } });
  }

  createOrg() {
    if (!this.newOrg.name) return;
    this.orgSvc.create(this.newOrg).subscribe({ next: () => { this.showCreate = false; this.newOrg = { name: '', category: 'Academic', description: '' }; this.load(); }, error: (e) => alert(e.error?.message) });
  }
}
