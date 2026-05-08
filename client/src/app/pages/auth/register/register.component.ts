import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

function passwordMatch(control: AbstractControl): ValidationErrors | null {
  const pass = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return pass === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-surface p-6 bg-grid-pattern bg-grid">
      <div class="w-full max-w-lg animate-slide-up">
        <div class="text-center mb-8">
          <div class="w-14 h-14 rounded-2xl bg-brand-600 mx-auto mb-4 flex items-center justify-center shadow-glow-sm">
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
              <path d="M20 4L6 14v18h10v-10h8v10h10V14L20 4z" fill="white"/>
            </svg>
          </div>
          <h2 class="font-display text-3xl font-bold text-white">Create your account</h2>
          <p class="text-gray-400 mt-2">Join the student organization community</p>
        </div>

        <div class="card p-8">
          @if (error()) {
            <div class="p-3 rounded-xl bg-red-900/30 border border-red-700/30 text-red-400 text-sm mb-5 animate-fade-in">{{ error() }}</div>
          }

          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-gray-400 mb-1.5">First name</label>
                <input type="text" formControlName="firstName" class="input-field" placeholder="Juan"
                  [class.input-error]="f['firstName'].touched && f['firstName'].invalid" />
              </div>
              <div>
                <label class="block text-sm text-gray-400 mb-1.5">Last name</label>
                <input type="text" formControlName="lastName" class="input-field" placeholder="dela Cruz"
                  [class.input-error]="f['lastName'].touched && f['lastName'].invalid" />
              </div>
            </div>

            <div>
              <label class="block text-sm text-gray-400 mb-1.5">Student ID <span class="text-gray-600">(optional)</span></label>
              <input type="text" formControlName="studentId" class="input-field" placeholder="2021-00001" />
            </div>

            <div>
              <label class="block text-sm text-gray-400 mb-1.5">Email address</label>
              <input type="email" formControlName="email" class="input-field" placeholder="you@university.edu"
                [class.input-error]="f['email'].touched && f['email'].invalid" />
            </div>

            <div>
              <label class="block text-sm text-gray-400 mb-1.5">Password</label>
              <input type="password" formControlName="password" class="input-field" placeholder="Min. 8 characters"
                [class.input-error]="f['password'].touched && f['password'].invalid" />
              @if (f['password'].touched && f['password'].errors?.['minlength']) {
                <p class="text-red-400 text-xs mt-1">Password must be at least 8 characters</p>
              }
            </div>

            <div>
              <label class="block text-sm text-gray-400 mb-1.5">Confirm password</label>
              <input type="password" formControlName="confirmPassword" class="input-field" placeholder="Repeat password"
                [class.input-error]="form.errors?.['passwordMismatch'] && f['confirmPassword'].touched" />
              @if (form.errors?.['passwordMismatch'] && f['confirmPassword'].touched) {
                <p class="text-red-400 text-xs mt-1">Passwords do not match</p>
              }
            </div>

            <button type="submit" [disabled]="loading() || form.invalid" class="btn-primary w-full mt-2">
              @if (loading()) {
                <span class="flex items-center justify-center gap-2">
                  <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" stroke-width="4"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>
                  Creating account...
                </span>
              } @else { Create account }
            </button>
          </form>
        </div>

        <p class="text-center text-gray-500 text-sm mt-6">
          Already have an account?
          <a routerLink="/login" class="text-brand-400 hover:text-brand-300 transition-colors ml-1 font-medium">Sign in</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    studentId: [''],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordMatch });

  loading = signal(false);
  error = signal('');
  get f() { return this.form.controls; }

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    const { firstName, lastName, email, password, studentId } = this.form.value;
    this.auth.register({ firstName: firstName!, lastName: lastName!, email: email!, password: password!, studentId: studentId || undefined }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => { this.error.set(err.error?.message || 'Registration failed.'); this.loading.set(false); },
    });
  }
}
