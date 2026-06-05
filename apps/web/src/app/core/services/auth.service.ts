import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable, catchError, of, tap } from 'rxjs';
import {
  AuthMessageResponse,
  AuthResponse,
  AuthUser,
  ForgotPasswordPayload,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  ResetPasswordPayload,
  VerifyLoginOtpPayload,
} from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = environment.authApiUrl + '/auth';

  currentUser = signal<AuthUser | null>(this.getStoredUser());

  constructor(private readonly http: HttpClient) {}

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, payload)
      .pipe(tap((response) => this.saveSession(response)));
  }

  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, payload);
  }

  verifyLoginOtp(payload: VerifyLoginOtpPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/verify-login-otp`, payload)
      .pipe(tap((response) => this.saveSession(response)));
  }

  forgotPassword(
    payload: ForgotPasswordPayload,
  ): Observable<AuthMessageResponse> {
    return this.http.post<AuthMessageResponse>(
      `${this.apiUrl}/forgot-password`,
      payload,
    );
  }

  resetPassword(
    payload: ResetPasswordPayload,
  ): Observable<AuthMessageResponse> {
    return this.http.post<AuthMessageResponse>(
      `${this.apiUrl}/reset-password`,
      payload,
    );
  }

  me(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.apiUrl}/me`);
  }

  loadCurrentUser(): Observable<AuthUser | null> {
    const token = this.getToken();

    if (!token) {
      this.logout();
      return of(null);
    }

    return this.me().pipe(
      tap((user) => this.saveUser(user)),
      catchError(() => {
        this.logout();
        return of(null);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem('preskool_access_token');
    localStorage.removeItem('preskool_user');
    localStorage.removeItem('preskool_otp_email');
    this.currentUser.set(null);
  }

  saveOtpEmail(email: string): void {
    localStorage.setItem('preskool_otp_email', email);
  }

  getOtpEmail(): string | null {
    return localStorage.getItem('preskool_otp_email');
  }

  clearOtpEmail(): void {
    localStorage.removeItem('preskool_otp_email');
  }

  getToken(): string | null {
    return localStorage.getItem('preskool_access_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  saveSession(response: AuthResponse): void {
    localStorage.setItem('preskool_access_token', response.accessToken);
    this.clearOtpEmail();
    this.saveUser(response.user);
  }

  private saveUser(user: AuthUser): void {
    localStorage.setItem('preskool_user', JSON.stringify(user));
    this.currentUser.set(user);
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

