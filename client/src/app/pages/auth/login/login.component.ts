import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex bg-surface">
      <!-- Left visual panel -->
      <div class="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-hero-gradient items-center justify-center p-12">
        <div class="absolute inset-0 bg-grid-pattern bg-grid opacity-30"></div>
        <div class="absolute inset-0" style="background: radial-gradient(ellipse at 50% 40%, rgba(99,102,241,0.25) 0%, transparent 65%)"></div>
        <div class="relative z-10 text-center max-w-md">
          <div class="w-20 h-20 rounded-3xl bg-brand-600 mx-auto mb-8 flex items-center justify-center shadow-glow">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M20 4L6 14v18h10v-10h8v10h10V14L20 4z" fill="white" opacity="0.95"/>
              <circle cx="20" cy="12" r="4" fill="white"/>
            </svg>
          </div>
          <h1 class="font-display text-4xl font-bold text-white mb-4">Student Organization<br/>Management System</h1>
          <p class="text-gray-400 text-lg leading-relaxed">Connect, collaborate, and grow with your campus community.</p>
          <div class="flex justify-center gap-6 mt-10">
            @for (stat of stats; track stat.label) {
              <div class="text-center">
                <div class="font-display text-2xl font-bold gradient-text">{{ stat.value }}</div>
                <div class="text-gray-500 text-sm">{{ stat.label }}</div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Right form panel -->
      <div class="flex-1 flex items-center justify-center p-8">
        <div class="w-full max-w-sm animate-slide-up">
          <div class="lg:hidden text-center mb-8">
            <div class="w-14 h-14 rounded-2xl bg-brand-600 mx-auto mb-4 flex items-center justify-center shadow-glow-sm">
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                <path d="M20 4L6 14v18h10v-10h8v10h10V14L20 4z" fill="white"/>
              </svg>
            </div>
          </div>

          <h2 class="font-display text-3xl font-bold text-white mb-2">Welcome back</h2>
          <p class="text-gray-400 mb-8">Sign in to your account</p>

          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
            @if (error()) {
              <div class="p-3 rounded-xl bg-red-900/30 border border-red-700/30 text-red-400 text-sm animate-fade-in">
                {{ error() }}
              </div>
            }

            <div>
              <label class="block text-sm text-gray-400 mb-1.5">Email address</label>
              <input
                type="email"
                formControlName="email"
                class="input-field"
                [class.input-error]="f['email'].touched && f['email'].invalid"
                placeholder="you@university.edu"
              />
              @if (f['email'].touched && f['email'].errors?.['email']) {
                <p class="text-red-400 text-xs mt-1">Enter a valid email</p>
              }
            </div>

            <div>
              <div class="flex justify-between items-center mb-1.5">
                <label class="text-sm text-gray-400">Password</label>
              </div>
              <div class="relative">
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  class="input-field pr-10"
                  [class.input-error]="f['password'].touched && f['password'].invalid"
                  placeholder="••••••••"
                />
                <button type="button" (click)="showPassword.set(!showPassword())"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  @if (showPassword()) {
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  } @else {
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            <button type="submit" [disabled]="loading() || form.invalid" class="btn-primary w-full mt-2">
              @if (loading()) {
                <span class="flex items-center justify-center gap-2">
                  <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" stroke-width="4"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>
                  Signing in...
                </span>
              } @else {
                Sign in
              }
            </button>
          </form>

          <p class="text-center text-gray-500 text-sm mt-6">
            Don't have an account?
            <a routerLink="/register" class="text-brand-400 hover:text-brand-300 transition-colors ml-1 font-medium">Create one</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  loading = signal(false);
  error = signal('');
  showPassword = signal(false);

  stats = [
    { value: '50+', label: 'Organizations' },
    { value: '2k+', label: 'Members' },
    { value: '100+', label: 'Events' },
  ];

  get f() { return this.form.controls; }

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    const { email, password } = this.form.value;
    this.auth.login(email!, password!).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error.set(err.error?.message || 'Login failed. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
