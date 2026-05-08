import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="flex h-screen overflow-hidden bg-surface">

      <!-- Sidebar -->
      <aside
        class="flex flex-col w-64 border-r border-surface-border bg-surface-card shrink-0 relative z-20"
        [class.hidden]="!sidebarOpen()"
        [class.fixed]="isMobile()"
        style="inset: 0 auto 0 0;"
      >
        <!-- Logo -->
        <div class="flex items-center gap-3 px-6 py-5 border-b border-surface-border">
          <div class="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-glow-sm">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L3 7v9h5v-5h4v5h5V7L10 2z" fill="white" opacity="0.9"/>
              <circle cx="10" cy="6" r="2" fill="white"/>
            </svg>
          </div>
          <div>
            <div class="font-display font-bold text-white text-sm leading-tight">SOMS</div>
            <div class="text-gray-500 text-xs">Student Orgs</div>
          </div>
        </div>

        <!-- Nav -->
        <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div class="text-xs text-gray-600 font-medium uppercase tracking-wider px-3 mb-2">Main</div>
          @for (item of navItems; track item.route) {
            @if (!item.adminOnly || authService.isAdmin) {
              <a
                [routerLink]="item.route"
                routerLinkActive="active"
                class="sidebar-link"
                (click)="closeMobileSidebar()"
              >
                <svg width="18" height="18" [innerHTML]="item.icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"></svg>
                <span class="text-sm font-medium">{{ item.label }}</span>
              </a>
            }
          }
        </nav>

        <!-- User Footer -->
        <div class="border-t border-surface-border p-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-brand-800 flex items-center justify-center text-brand-300 text-sm font-display font-600 shrink-0">
              {{ initials }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-white text-sm font-medium truncate">{{ fullName }}</div>
              <div class="text-gray-500 text-xs truncate">{{ authService.currentUser?.role }}</div>
            </div>
            <button (click)="authService.logout()" class="text-gray-500 hover:text-red-400 transition-colors" title="Logout">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <!-- Mobile overlay -->
      @if (isMobile() && sidebarOpen()) {
        <div class="fixed inset-0 bg-black/60 z-10 backdrop-blur-sm" (click)="sidebarOpen.set(false)"></div>
      }

      <!-- Main content -->
      <div class="flex-1 flex flex-col overflow-hidden">

        <!-- Top bar -->
        <header class="h-16 border-b border-surface-border bg-surface-card/80 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
          <button
            class="text-gray-400 hover:text-white transition-colors lg:hidden"
            (click)="sidebarOpen.set(!sidebarOpen())"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div class="hidden lg:block"></div>

          <div class="flex items-center gap-3">
            @if (authService.isAdmin) {
              <span class="badge-brand text-xs">Admin</span>
            }
            <a routerLink="/profile" class="w-9 h-9 rounded-full bg-brand-800 flex items-center justify-center text-brand-300 text-sm font-display font-600 hover:ring-2 hover:ring-brand-500 transition-all">
              {{ initials }}
            </a>
          </div>
        </header>

        <!-- Page content -->
        <main class="flex-1 overflow-y-auto p-6 bg-grid-pattern bg-grid">
          <div class="max-w-7xl mx-auto animate-fade-in">
            <router-outlet />
          </div>
        </main>
      </div>
    </div>
  `,
})
export class ShellComponent implements OnInit {
  sidebarOpen = signal(true);
  isMobile = signal(false);

  navItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>' },
    { label: 'Organizations', route: '/organizations', icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>' },
    { label: 'Events', route: '/events', icon: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' },
    { label: 'Documents', route: '/documents', icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>' },
    { label: 'Admin Panel', route: '/admin', icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>', adminOnly: true },
  ];

  constructor(public authService: AuthService) {}

  ngOnInit() {
    this.checkMobile();
    window.addEventListener('resize', () => this.checkMobile());
  }

  checkMobile() {
    this.isMobile.set(window.innerWidth < 1024);
    if (window.innerWidth < 1024) this.sidebarOpen.set(false);
    else this.sidebarOpen.set(true);
  }

  closeMobileSidebar() {
    if (this.isMobile()) this.sidebarOpen.set(false);
  }

  get fullName(): string {
    const u = this.authService.currentUser;
    return u ? `${u.firstName} ${u.lastName}` : '';
  }

  get initials(): string {
    const u = this.authService.currentUser;
    return u ? `${u.firstName[0]}${u.lastName[0]}`.toUpperCase() : '?';
  }
}
