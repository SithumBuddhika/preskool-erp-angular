import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  CreateStaffAttendancePayload,
  StaffAttendance,
} from '../models/staff-attendance.model';

@Injectable({
  providedIn: 'root',
})
export class StaffAttendanceService {
  private readonly apiUrl = 'http://localhost:3002/api/staff-attendance';

  constructor(private readonly http: HttpClient) {}

  getStaffAttendance(search = '', date = '') {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    if (date.trim()) {
      params = params.set('date', date.trim());
    }

    return this.http.get<StaffAttendance[]>(this.apiUrl, { params });
  }

  createStaffAttendance(payload: CreateStaffAttendancePayload) {
    return this.http.post<StaffAttendance>(this.apiUrl, payload);
  }

  updateStaffAttendance(
    id: string,
    payload: Partial<CreateStaffAttendancePayload>,
  ) {
    return this.http.patch<StaffAttendance>(`${this.apiUrl}/${id}`, payload);
  }

  deleteStaffAttendance(id: string) {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
