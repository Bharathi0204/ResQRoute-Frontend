import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, of } from 'rxjs';
import { User, AuthResponse, HealthResponse, UserRole } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

  private currentUserSignal = signal<User | null>(this.getStoredUser());
  public currentUser = computed(() => this.currentUserSignal());
  public isLoggedIn = computed(() => !!this.currentUserSignal());

  constructor() {
    // Optionally fetch fresh profile on startup if token exists
    if (this.getToken()) {
      this.fetchMe().subscribe({
        error: () => this.clearSession()
      });
    }
  }

  public getToken(): string | null {
    return localStorage.getItem('resqroute_access_token');
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem('resqroute_refresh_token');
  }

  private getStoredUser(): User | null {
    const raw = localStorage.getItem('resqroute_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  public checkHealth(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.apiUrl}/health/`);
  }

  public register(payload: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/api/auth/register/`, payload).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  public login(credentials: { username: string; password: string; role?: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/api/auth/login/`, credentials).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  public fetchMe(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/api/auth/me/`).pipe(
      tap(user => {
        this.currentUserSignal.set(user);
        localStorage.setItem('resqroute_user', JSON.stringify(user));
      })
    );
  }

  public logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  private clearSession(): void {
    localStorage.removeItem('resqroute_access_token');
    localStorage.removeItem('resqroute_refresh_token');
    localStorage.removeItem('resqroute_user');
    this.currentUserSignal.set(null);
  }

  private handleAuthSuccess(res: AuthResponse): void {
    localStorage.setItem('resqroute_access_token', res.access);
    localStorage.setItem('resqroute_refresh_token', res.refresh);
    localStorage.setItem('resqroute_user', JSON.stringify(res.user));
    this.currentUserSignal.set(res.user);
  }

  public navigateForRole(role: UserRole): void {
    if (role === 'DRIVER') {
      this.router.navigate(['/driver/dashboard']);
    } else if (role === 'ADMIN') {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/customer/dashboard']);
    }
  }
}
