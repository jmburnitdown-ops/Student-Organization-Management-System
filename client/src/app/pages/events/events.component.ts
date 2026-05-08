import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { EventService } from '../../services/event.service';
import { OrganizationService } from '../../services/organization.service';
import { AuthService } from '../../services/auth.service';
import { Event, Organization, PaginatedResponse } from '../../models';

const STATUS_COLORS: Record<string, string> = {
  UPCOMING: 'badge-brand',
  ONGOING: 'badge-success',
  COMPLETED: 'badge-gray',
  CANCELLED: 'badge-danger',
};

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="section-title">Events</h1>
          <p class="text-gray-400 mt-1">Stay updated with campus activities</p>
        </div>
        @if (auth.isAdmin) {
          <button (click)="showCreate = true" class="btn-primary flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Event
          </button>
        }
      </div>

      <!-- Filter bar -->
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1 max-w-xs">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input [(ngModel)]="search" (ngModelChange)="load()" type="text" placeholder="Search events..." class="input-field pl-9 text-sm" />
        </div>
        <div class="flex gap-2">
          @for (s of statuses; track s.value) {
            <button (click)="filterStatus(s.value)"
              class="px-3 py-1.5 rounded-lg text-xs border transition-all"
              [class]="activeStatus === s.value ? 'bg-brand-600 text-white border-brand-600' : 'bg-surface-elevated text-gray-400 border-surface-border hover:text-white'">
              {{ s.label }}
            </button>
          }
        </div>
      </div>

      <!-- Events grid -->
      @if (loading()) {
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="card p-6 space-y-3">
              <div class="skeleton h-40 rounded-xl"></div>
              <div class="skeleton h-4 w-3/4 rounded"></div>
              <div class="skeleton h-3 w-1/2 rounded"></div>
            </div>
          }
        </div>
      } @else if (result()?.data?.length === 0) {
        <div class="text-center py-16 text-gray-500">
          <svg class="w-12 h-12 mx-auto mb-4 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <p>No events found</p>
        </div>
      } @else {
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          @for (evt of result()?.data; track evt.id) {
            <div class="card overflow-hidden hover:border-brand-700/50 transition-all duration-200 group flex flex-col">
              <!-- Event color block -->
              <div class="h-28 relative overflow-hidden"
                [style]="'background: linear-gradient(135deg, ' + eventColor(evt.status) + ')'">
                <div class="absolute inset-0 bg-grid-pattern bg-grid opacity-20"></div>
                <div class="absolute top-3 right-3">
                  <span [class]="statusBadge(evt.status)">{{ evt.status }}</span>
                </div>
                <div class="absolute bottom-3 left-4 text-white">
                  <div class="text-xs opacity-70 uppercase tracking-wider">{{ evt.organization?.name }}</div>
                </div>
              </div>

              <div class="p-5 flex-1 flex flex-col gap-3">
                <h3 class="font-display font-600 text-white group-hover:text-brand-300 transition-colors leading-snug">{{ evt.title }}</h3>
                @if (evt.description) {
                  <p class="text-gray-500 text-sm line-clamp-2">{{ evt.description }}</p>
                }
                <div class="space-y-1.5 mt-auto">
                  <div class="flex items-center gap-2 text-gray-400 text-xs">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    {{ formatDate(evt.startDate) }}
                  </div>
                  @if (evt.location) {
                    <div class="flex items-center gap-2 text-gray-400 text-xs">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {{ evt.location }}
                    </div>
                  }
                </div>

                @if (auth.isAdmin) {
                  <div class="flex gap-2 pt-2 border-t border-surface-border">
                    <button (click)="deleteEvent(evt.id)" class="btn-danger text-xs flex-1 py-1.5">Delete</button>
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <!-- Pagination -->
        @if (result()?.meta?.totalPages! > 1) {
          <div class="flex justify-center gap-2">
            <button (click)="goPage(page - 1)" [disabled]="!result()?.meta?.hasPrev" class="btn-secondary text-sm px-4 py-2">← Prev</button>
            <span class="flex items-center text-gray-400 text-sm px-4">{{ page }} / {{ result()?.meta?.totalPages }}</span>
            <button (click)="goPage(page + 1)" [disabled]="!result()?.meta?.hasNext" class="btn-secondary text-sm px-4 py-2">Next →</button>
          </div>
        }
      }
    </div>

    <!-- Create Event Modal -->
    @if (showCreate && auth.isAdmin) {
      <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="card w-full max-w-lg p-8 animate-slide-up max-h-[90vh] overflow-y-auto">
          <h2 class="font-display text-xl font-600 text-white mb-6">Create Event</h2>
          <form [formGroup]="createForm" (ngSubmit)="createEvent()" class="space-y-4">
            <input formControlName="title" placeholder="Event title *" class="input-field" />
            <textarea formControlName="description" placeholder="Description" class="input-field h-20 resize-none"></textarea>
            <input formControlName="location" placeholder="Location" class="input-field" />
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-xs text-gray-500 mb-1 block">Start date *</label>
                <input formControlName="startDate" type="datetime-local" class="input-field text-sm" />
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">End date *</label>
                <input formControlName="endDate" type="datetime-local" class="input-field text-sm" />
              </div>
            </div>
            <select formControlName="organizationId" class="input-field">
              <option value="">Select organization *</option>
              @for (org of orgs(); track org.id) {
                <option [value]="org.id">{{ org.name }}</option>
              }
            </select>
            <input formControlName="maxAttendees" type="number" placeholder="Max attendees (optional)" class="input-field" />
            <div class="flex gap-3 pt-2">
              <button type="button" (click)="showCreate = false" class="btn-secondary flex-1">Cancel</button>
              <button type="submit" [disabled]="createForm.invalid || creating()" class="btn-primary flex-1">
                {{ creating() ? 'Creating...' : 'Create Event' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class EventsComponent implements OnInit {
  result = signal<PaginatedResponse<Event> | null>(null);
  orgs = signal<Organization[]>([]);
  loading = signal(true);
  creating = signal(false);
  showCreate = false;
  search = '';
  activeStatus = '';
  page = 1;

  statuses = [
    { label: 'All', value: '' },
    { label: 'Upcoming', value: 'UPCOMING' },
    { label: 'Ongoing', value: 'ONGOING' },
    { label: 'Completed', value: 'COMPLETED' },
  ];

  createForm = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    location: [''],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    organizationId: ['', Validators.required],
    maxAttendees: [null],
  });

  constructor(private eventSvc: EventService, private orgSvc: OrganizationService, public auth: AuthService, private fb: FormBuilder) {}

  ngOnInit() {
    this.load();
    if (this.auth.isAdmin) {
      this.orgSvc.list({ limit: 100 }).subscribe(r => this.orgs.set(r.data));
    }
  }

  load() {
    this.loading.set(true);
    const params: any = { page: this.page, limit: 9 };
    if (this.search) params.search = this.search;
    if (this.activeStatus) params.status = this.activeStatus;
    this.eventSvc.list(params).subscribe({ next: r => { this.result.set(r); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  filterStatus(s: string) { this.activeStatus = s; this.page = 1; this.load(); }
  goPage(p: number) { this.page = p; this.load(); }

  createEvent() {
    if (this.createForm.invalid) return;
    this.creating.set(true);
    this.eventSvc.create(this.createForm.value as any).subscribe({
      next: () => { this.creating.set(false); this.showCreate = false; this.createForm.reset(); this.load(); },
      error: (e) => { this.creating.set(false); alert(e.error?.message); },
    });
  }

  deleteEvent(id: string) {
    if (!confirm('Delete this event?')) return;
    this.eventSvc.delete(id).subscribe({ next: () => this.load(), error: (e) => alert(e.error?.message) });
  }

  statusBadge(s: string) { return STATUS_COLORS[s] || 'badge-gray'; }

  eventColor(status: string) {
    const map: Record<string, string> = {
      UPCOMING: '#3730a3, #4338ca',
      ONGOING: '#065f46, #059669',
      COMPLETED: '#1f2937, #374151',
      CANCELLED: '#7f1d1d, #991b1b',
    };
    return map[status] || '#1e1e38, #2a2a4a';
  }

  formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
