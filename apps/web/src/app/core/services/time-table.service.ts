import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  CreateTimeTablePayload,
  TimeTable,
  UpdateTimeTablePayload,
} from '../models/time-table.model';

@Injectable({
  providedIn: 'root',
})
export class TimeTableService {
  private readonly apiUrl = 'http://localhost:3003/api/time-table';

  constructor(private readonly http: HttpClient) {}

  getTimeTable(search = ''): Observable<TimeTable[]> {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<TimeTable[]>(this.apiUrl, { params });
  }

  createTimeTable(payload: CreateTimeTablePayload): Observable<TimeTable> {
    return this.http.post<TimeTable>(this.apiUrl, payload);
  }

  updateTimeTable(
    id: string,
    payload: UpdateTimeTablePayload,
  ): Observable<TimeTable> {
    return this.http.patch<TimeTable>(`${this.apiUrl}/${id}`, payload);
  }

  deleteTimeTable(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  generateNextTimeTableCode(): Observable<string> {
    return this.http
      .get<{ timeTableCode: string }>(`${this.apiUrl}/next-code`)
      .pipe(map((response) => response.timeTableCode));
  }
}
