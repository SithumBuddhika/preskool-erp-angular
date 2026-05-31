import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  ClassRoutine,
  CreateClassRoutinePayload,
  UpdateClassRoutinePayload,
} from '../models/class-routine.model';

@Injectable({
  providedIn: 'root',
})
export class ClassRoutinesService {
  private readonly apiUrl = 'http://localhost:3003/api/class-routines';

  constructor(private readonly http: HttpClient) {}

  getClassRoutines(search = ''): Observable<ClassRoutine[]> {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<ClassRoutine[]>(this.apiUrl, { params });
  }

  createClassRoutine(
    payload: CreateClassRoutinePayload,
  ): Observable<ClassRoutine> {
    return this.http.post<ClassRoutine>(this.apiUrl, payload);
  }

  updateClassRoutine(
    id: string,
    payload: UpdateClassRoutinePayload,
  ): Observable<ClassRoutine> {
    return this.http.patch<ClassRoutine>(`${this.apiUrl}/${id}`, payload);
  }

  deleteClassRoutine(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  generateNextRoutineCode(): Observable<string> {
    return this.http
      .get<{ routineCode: string }>(`${this.apiUrl}/next-code`)
      .pipe(map((response) => response.routineCode));
  }
}
