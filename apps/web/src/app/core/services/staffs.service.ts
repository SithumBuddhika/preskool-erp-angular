import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CreateStaffPayload, Staff } from '../models/staff.model';

@Injectable({
  providedIn: 'root',
})
export class StaffsService {
  private readonly apiUrl = 'http://localhost:3002/api/staffs';

  constructor(private readonly http: HttpClient) {}

  getStaffs(search = ''): Observable<Staff[]> {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<Staff[]>(this.apiUrl, { params });
  }

  createStaff(payload: CreateStaffPayload): Observable<Staff> {
    return this.http.post<Staff>(this.apiUrl, payload);
  }

  updateStaff(
    id: string,
    payload: Partial<CreateStaffPayload>,
  ): Observable<Staff> {
    return this.http.patch<Staff>(`${this.apiUrl}/${id}`, payload);
  }

  deleteStaff(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  generateNextStaffCode(): Observable<string> {
    return this.http
      .get<{ staffCode: string }>(`${this.apiUrl}/next-code`)
      .pipe(map((response) => response.staffCode));
  }
}
