import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { User, AuthResponse, ApiResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());

  currentUser$ = this.currentUserSubject.asObservable();
  isLoggedIn$ = this.currentUser$.pipe(map(u => !!u));

  constructor(private http: HttpClient, private router: Router) {}

  get currentUser(): User | null { return this.currentUserSubject.value; }
  get isAdmin(): boolean { return this.currentUser?.role === 'ADMIN'; }
  get token(): string | null { return localStorage.getItem('access_token'); }

  register(data: { email: string; password: string; firstName: string; lastName: string; studentId?: string }) {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/register`, data).pipe(
      tap(res => { if (res.data) this.storeAuth(res.data); })
    );
  }

  login(email: string, password: string) {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(res => { if (res.data) this.storeAuth(res.data); })
    );
  }

  logout() {
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe();
    this.clearAuth();
    this.router.navigate(['/login']);
  }

  getMe(): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/me`).pipe(
      tap(res => { if (res.data) { this.currentUserSubject.next(res.data); localStorage.setItem('user', JSON.stringify(res.data)); } }),
      map(res => res.data!)
    );
  }

  private storeAuth(data: AuthResponse) {
    localStorage.setItem('access_token', data.accessToken);
    localStorage.setItem('refresh_token', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    this.currentUserSubject.next(data.user);
  }

  private clearAuth() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  private getStoredUser(): User | null {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); }
    catch { return null; }
  }
}
