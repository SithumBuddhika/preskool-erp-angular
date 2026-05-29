import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import {
  AuthResponse,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:3001/api/auth';

  currentUser = signal<AuthUser | null>(this.getStoredUser());

  constructor(private readonly http: HttpClient) {}

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, payload)
      .pipe(tap((response) => this.saveSession(response)));
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, payload)
      .pipe(tap((response) => this.saveSession(response)));
  }

  logout(): void {
    localStorage.removeItem('preskool_access_token');
    localStorage.removeItem('preskool_user');
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem('preskool_access_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private saveSession(response: AuthResponse): void {
    localStorage.setItem('preskool_access_token', response.accessToken);
    localStorage.setItem('preskool_user', JSON.stringify(response.user));
    this.currentUser.set(response.user);
  }

  private getStoredUser(): AuthUser | null {
    const storedUser = localStorage.getItem('preskool_user');

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as AuthUser;
    } catch {
      localStorage.removeItem('preskool_user');
      return null;
    }
  }
}
