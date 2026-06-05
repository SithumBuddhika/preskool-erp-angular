import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  AdminUser,
  CreateAdminUserPayload,
  UpdateAdminStatusPayload,
  UpdateAdminTwoStepPayload,
  UpdateAdminUserPayload,
} from '../models/admin-user.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AdminUsersService {
  private readonly apiUrl = environment.authApiUrl + '/auth/admin-users';

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
  ) {}

  getAdminUsers() {
    return this.http.get<AdminUser[]>(this.apiUrl, {
      headers: this.getAuthHeaders(),
    });
  }

  createAdminUser(payload: CreateAdminUserPayload) {
    return this.http.post<AdminUser>(this.apiUrl, payload, {
      headers: this.getAuthHeaders(),
    });
  }

  updateAdminUser(id: string, payload: UpdateAdminUserPayload) {
    return this.http.patch<AdminUser>(`${this.apiUrl}/${id}`, payload, {
      headers: this.getAuthHeaders(),
    });
  }

  updateAdminStatus(id: string, payload: UpdateAdminStatusPayload) {
    return this.http.patch<AdminUser>(`${this.apiUrl}/${id}/status`, payload, {
      headers: this.getAuthHeaders(),
    });
  }

  updateAdminTwoStep(id: string, payload: UpdateAdminTwoStepPayload) {
    return this.http.patch<AdminUser>(
      `${this.apiUrl}/${id}/two-step`,
      payload,
      {
        headers: this.getAuthHeaders(),
      },
    );
  }

  deleteAdminUser(id: string) {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();

    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
    });
  }
}

