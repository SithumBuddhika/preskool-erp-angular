import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  CreateStudentAttendancePayload,
  StudentAttendance,
} from '../models/student-attendance.model';

@Injectable({
  providedIn: 'root',
})
export class StudentAttendanceService {
  private readonly apiUrl = 'http://localhost:3002/api/student-attendance';

  constructor(private readonly http: HttpClient) {}

  getAttendanceRecords(search = ''): Observable<StudentAttendance[]> {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<StudentAttendance[]>(this.apiUrl, { params });
  }

  createAttendanceRecord(
    payload: CreateStudentAttendancePayload,
  ): Observable<StudentAttendance> {
    return this.http.post<StudentAttendance>(this.apiUrl, payload);
  }

  updateAttendanceRecord(
    id: string,
    payload: Partial<CreateStudentAttendancePayload>,
  ): Observable<StudentAttendance> {
    return this.http.patch<StudentAttendance>(`${this.apiUrl}/${id}`, payload);
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
