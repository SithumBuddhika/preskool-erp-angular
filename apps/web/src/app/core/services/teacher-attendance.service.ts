import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';
import {
  CreateTeacherAttendancePayload,
  TeacherAttendance,
} from '../models/teacher-attendance.model';

@Injectable({
  providedIn: 'root',
})
export class TeacherAttendanceService {
  private readonly apiUrl = environment.peopleApiUrl + '/teacher-attendance';

  constructor(private readonly http: HttpClient) {}

  getAttendanceRecords(search = ''): Observable<TeacherAttendance[]> {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<TeacherAttendance[]>(this.apiUrl, { params });
  }

  createAttendanceRecord(
    payload: CreateTeacherAttendancePayload,
  ): Observable<TeacherAttendance> {
    return this.http.post<TeacherAttendance>(this.apiUrl, payload);
  }

  updateAttendanceRecord(
    id: string,
    payload: Partial<CreateTeacherAttendancePayload>,
  ): Observable<TeacherAttendance> {
    return this.http.patch<TeacherAttendance>(`${this.apiUrl}/${id}`, payload);
  }

  deleteAttendanceRecord(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  generateNextAttendanceCode(): Observable<string> {
    return this.http
      .get<{ attendanceCode: string }>(`${this.apiUrl}/next-code`)
      .pipe(map((response) => response.attendanceCode));
  }
}

