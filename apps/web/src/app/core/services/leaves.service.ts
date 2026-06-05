import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';
import { CreateLeavePayload, StaffLeave } from '../models/leave.model';

@Injectable({
  providedIn: 'root',
})
export class LeavesService {
  private readonly apiUrl = environment.peopleApiUrl + '/leaves';

  constructor(private readonly http: HttpClient) {}

  getLeaves(search = ''): Observable<StaffLeave[]> {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<StaffLeave[]>(this.apiUrl, { params });
  }

  createLeave(payload: CreateLeavePayload): Observable<StaffLeave> {
    return this.http.post<StaffLeave>(this.apiUrl, payload);
  }

  updateLeave(
    id: string,
    payload: Partial<CreateLeavePayload>,
  ): Observable<StaffLeave> {
    return this.http.patch<StaffLeave>(`${this.apiUrl}/${id}`, payload);
  }

  deleteLeave(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  generateNextLeaveCode(): Observable<string> {
    return this.http
      .get<{ leaveCode: string }>(`${this.apiUrl}/next-code`)
      .pipe(map((response) => response.leaveCode));
  }
}

