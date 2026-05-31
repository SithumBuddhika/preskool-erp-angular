import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  CreateGradePayload,
  Grade,
  UpdateGradePayload,
} from '../models/grade.model';

@Injectable({
  providedIn: 'root',
})
export class GradesService {
  private readonly apiUrl = 'http://localhost:3003/api/grades';

  constructor(private readonly http: HttpClient) {}

  getGrades(search = ''): Observable<Grade[]> {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<Grade[]>(this.apiUrl, { params });
  }

  createGrade(payload: CreateGradePayload): Observable<Grade> {
    return this.http.post<Grade>(this.apiUrl, payload);
  }

  updateGrade(id: string, payload: UpdateGradePayload): Observable<Grade> {
    return this.http.patch<Grade>(`${this.apiUrl}/${id}`, payload);
  }

  deleteGrade(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  generateNextGradeCode(): Observable<string> {
    return this.http
      .get<{ gradeCode: string }>(`${this.apiUrl}/next-code`)
      .pipe(map((response) => response.gradeCode));
  }
}
