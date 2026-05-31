import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  CreateExamPayload,
  Exam,
  UpdateExamPayload,
} from '../models/exam.model';

@Injectable({
  providedIn: 'root',
})
export class ExamsService {
  private readonly apiUrl = 'http://localhost:3003/api/exams';

  constructor(private readonly http: HttpClient) {}

  getExams(search = ''): Observable<Exam[]> {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<Exam[]>(this.apiUrl, { params });
  }

  createExam(payload: CreateExamPayload): Observable<Exam> {
    return this.http.post<Exam>(this.apiUrl, payload);
  }

  updateExam(id: string, payload: UpdateExamPayload): Observable<Exam> {
    return this.http.patch<Exam>(`${this.apiUrl}/${id}`, payload);
  }

  deleteExam(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  generateNextExamCode(): Observable<string> {
    return this.http
      .get<{ examCode: string }>(`${this.apiUrl}/next-code`)
      .pipe(map((response) => response.examCode));
  }
}
