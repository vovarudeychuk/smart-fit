import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
  success?: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private baseUrl = environment.apiUrl;
  
  private tokenKey = 'auth_token';
  private userKey = 'user_data';
  
  // State signals
  isAuthenticated = signal<boolean>(this.hasValidToken());
  currentUser = signal<User | null>(this.getUserFromStorage());
  
  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, { username, password })
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(error => {
          console.error('Login failed:', error);
          return throwError(() => new Error(error.error?.message || 'Login failed. Please try again.'));
        })
      );
  }
  
  register(userData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/register`, userData)
      .pipe(
        tap(response => {
          if (response.success) {
            this.handleAuthResponse(response);
          }
        }),
        catchError(error => {
          console.error('Registration failed:', error);
          return throwError(() => new Error(error.error?.message || 'Registration failed. Please try again.'));
        })
      );
  }
  
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
  
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }
  
  private hasValidToken(): boolean {
    const token = this.getToken();
    // A more sophisticated check would validate the token's expiration
    return !!token;
  }
  
  private getUserFromStorage(): User | null {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }
  
  private handleAuthResponse(response: AuthResponse): void {
    if (response && response.access_token) {
      localStorage.setItem(this.tokenKey, response.access_token);
      localStorage.setItem(this.userKey, JSON.stringify(response.user));
      this.isAuthenticated.set(true);
      this.currentUser.set(response.user);
    }
  }
  
  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/auth/profile`)
      .pipe(
        tap(user => {
          localStorage.setItem(this.userKey, JSON.stringify(user));
          this.currentUser.set(user);
        }),
        catchError(error => {
          if (error.status === 401) {
            this.logout();
          }
          return throwError(() => error);
        })
      );
  }

  // Verify token on app startup
  verifyAuth(): Observable<boolean> {
    if (!this.hasValidToken()) {
      this.isAuthenticated.set(false);
      return of(false);
    }

    // Try to fetch the profile to verify token
    return this.http.get<User>(`${this.baseUrl}/auth/profile`).pipe(
      map(user => {
        // Update user data
        localStorage.setItem(this.userKey, JSON.stringify(user));
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
        return true;
      }),
      catchError(error => {
        // If token is invalid, clear auth state
        if (error.status === 401) {
          this.logout();
        }
        return of(false);
      })
    );
  }
} 