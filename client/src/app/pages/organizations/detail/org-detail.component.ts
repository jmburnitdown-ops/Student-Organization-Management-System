import { Component, OnInit, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrganizationService } from '../../../services/organization.service';
import { MembershipService } from '../../../services/membership.service';
import { AuthService } from '../../../services/auth.service';
import { Organization, Membership } from '../../../models';

@Component({
  selector: 'app-org-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Back -->
      <a routerLink="/organizations" class="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        Back to Organizations
      </a>

      @if (loading()) {
        <div class="space-y-4">
          <div class="skeleton h-48 rounded-2xl"></div>
          <div class="skeleton h-8 w-64 rounded"></div>
          <div class="skeleton h-4 w-full rounded"></div>
        </div>
      } @else if (errorMessage()) {
        <div class="card p-6 border border-red-800/40 bg-red-900/10">
          <h2 class="text-red-300 font-medium mb-2">Failed to load organization</h2>
          <p class="text-red-200/90 text-sm">{{ errorMessage() }}</p>
        </div>
      } @else if (org()) {
        <!-- Banner / Header card -->
        <div class="card overflow-hidden">
          <div class="h-24 sm:h-28 bg-gradient-to-r from-brand-900 via-brand-800 to-surface-elevated relative">
            <div class="absolute inset-0 bg-grid-pattern bg-grid opacity-20"></div>
          </div>
          <div class="px-4 sm:px-6 pb-6 pt-4 relative z-10">
            <div class="flex flex-col lg:flex-row lg:items-end gap-4 mb-4">
              <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-brand-700 border-4 border-surface-card flex items-center justify-center text-white font-display text-2xl sm:text-3xl font-bold shrink-0 shadow-glow-sm -mt-12 sm:-mt-14">
                {{ org()!.name.charAt(0) }}
              </div>
              <div class="pb-0 lg:pb-2 flex-1 min-w-0">
                <h1 class="font-display text-2xl font-bold text-white truncate">{{ org()!.name }}</h1>
                <div class="flex items-center gap-3 mt-1 flex-wrap">
                  <span class="badge-brand text-xs">{{ org()!.category }}</span>
                  <span class="text-gray-500 text-xs flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    {{ org()!._count?.memberships || 0 }} members
                  </span>
                  <span class="text-gray-500 text-xs flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    {{ org()!._count?.events || 0 }} events
                  </span>
                </div>
              </div>
              <div class="flex flex-wrap gap-2 lg:pb-2 lg:justify-end">
                <button (click)="joinOrg()" [disabled]="joining()" class="btn-primary text-sm">
                  {{ joining() ? 'Requesting...' : 'Join Organization' }}
                </button>
                @if (auth.isAdmin) {
                  <button (click)="deleteOrg()" class="btn-danger border border-red-800/40 rounded-xl px-4 py-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                  </button>
                }
              </div>
            </div>

            @if (org()!.description) {
              <p class="text-gray-400 leading-relaxed">{{ org()!.description }}</p>
            }
          </div>
        </div>

        <!-- Members table (admin) -->
        @if (auth.isAdmin) {
          <div class="card p-6">
            <div class="flex items-center justify-between mb-5">
              <h2 class="font-display text-lg font-600 text-white">Members</h2>
              <div class="flex gap-2">
                @for (s of memberStatuses; track s.value) {
                  <button (click)="filterStatus(s.value)" class="px-3 py-1.5 rounded-lg text-xs border transition-all"
                    [class]="memberStatus === s.value ? 'bg-brand-600 text-white border-brand-600' : 'bg-surface-elevated text-gray-400 border-surface-border hover:text-white'">
                    {{ s.label }}
                  </button>
                }
              </div>
            </div>

            @if (loadingMembers()) {
              <div class="space-y-3">@for (i of [1,2,3]; track i) { <div class="skeleton h-14 rounded-xl"></div> }</div>
            } @else if (members().length === 0) {
              <div class="text-center py-8 text-gray-500 text-sm">No members found.</div>
            } @else {
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-left text-gray-500 text-xs uppercase tracking-wider border-b border-surface-border">
                      <th class="pb-3 font-medium">Member</th>
                      <th class="pb-3 font-medium">Student ID</th>
                      <th class="pb-3 font-medium">Status</th>
                      <th class="pb-3 font-medium">Joined</th>
                      @if (memberStatus === 'PENDING') { <th class="pb-3 font-medium">Actions</th> }
                    </tr>
                  </thead>
                  <tbody>
                    @for (m of members(); track m.id) {
                      <tr class="table-row">
                        <td class="py-3 pr-4">
                          <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-brand-900 flex items-center justify-center text-brand-300 text-xs font-medium shrink-0">
                              {{ m.user?.firstName?.charAt(0) }}{{ m.user?.lastName?.charAt(0) }}
                            </div>
                            <div>
                              <div class="text-white font-medium">{{ m.user?.firstName }} {{ m.user?.lastName }}</div>
                              <div class="text-gray-500 text-xs">{{ m.user?.email }}</div>
                            </div>
                          </div>
                        </td>
                        <td class="py-3 pr-4 text-gray-400">{{ m.user?.studentId || '—' }}</td>
                        <td class="py-3 pr-4"><span [class]="statusBadge(m.status)">{{ m.status }}</span></td>
                        <td class="py-3 pr-4 text-gray-500">{{ m.joinedAt ? formatDate(m.joinedAt) : '—' }}</td>
                        @if (memberStatus === 'PENDING') {
                          <td class="py-3">
                            <div class="flex gap-2">
                              <button (click)="approveMember(m.id)" class="text-green-400 hover:text-green-300 text-xs font-medium px-3 py-1 rounded-lg hover:bg-green-900/30 transition-all">Approve</button>
                              <button (click)="rejectMember(m.id)" class="text-red-400 hover:text-red-300 text-xs font-medium px-3 py-1 rounded-lg hover:bg-red-900/30 transition-all">Reject</button>
                            </div>
                          </td>
                        }
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
})
export class OrgDetailComponent implements OnInit {
  @Input() id!: string;
  org = signal<Organization | null>(null);
  errorMessage = signal('');
  members = signal<Membership[]>([]);
  loading = signal(true);
  loadingMembers = signal(false);
  joining = signal(false);
  memberStatus = 'PENDING';

  memberStatuses = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  constructor(
    private route: ActivatedRoute,
    private orgSvc: OrganizationService,
    private membershipSvc: MembershipService,
    public auth: AuthService
  ) {}

  ngOnInit() {
    const routeId = this.route.snapshot.paramMap.get('id') || '';
    this.id = this.id || routeId;

    if (!this.id) {
      this.errorMessage.set('Missing organization ID in route.');
      this.loading.set(false);
      return;
    }

    this.orgSvc.getById(this.id).subscribe({
      next: (o) => {
        this.org.set(o);
        this.loading.set(false);
        if (this.auth.isAdmin) this.loadMembers();
      },
      error: (e) => {
        this.errorMessage.set(e?.error?.message || 'Unable to fetch organization details.');
        this.loading.set(false);
      },
    });
  }

  loadMembers() {
    this.loadingMembers.set(true);
    this.orgSvc.getMembers(this.id, { status: this.memberStatus }).subscribe({ next: r => { this.members.set(r.data); this.loadingMembers.set(false); }, error: () => this.loadingMembers.set(false) });
  }

  filterStatus(s: string) { this.memberStatus = s; this.loadMembers(); }

  joinOrg() {
    this.joining.set(true);
    this.membershipSvc.join(this.id).subscribe({ next: () => { this.joining.set(false); alert('Join request submitted!'); }, error: (e) => { this.joining.set(false); alert(e.error?.message || 'Error'); } });
  }

  approveMember(id: string) {
    this.membershipSvc.approve(id).subscribe({ next: () => this.loadMembers(), error: (e) => alert(e.error?.message) });
  }

  rejectMember(id: string) {
    this.membershipSvc.reject(id).subscribe({ next: () => this.loadMembers(), error: (e) => alert(e.error?.message) });
  }

  deleteOrg() {
    if (!confirm('Deactivate this organization?')) return;
    this.orgSvc.delete(this.id).subscribe({ next: () => history.back(), error: (e) => alert(e.error?.message) });
  }

  statusBadge(s: string) {
    return { APPROVED: 'badge-success', PENDING: 'badge-warning', REJECTED: 'badge-danger' }[s] || 'badge-gray';
  }

  formatDate(d: string) { return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }); }
}
