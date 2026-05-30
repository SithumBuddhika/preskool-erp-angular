import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateStudentPayload, Student } from '../models/student.model';

@Injectable({
  providedIn: 'root',
})
export class StudentsService {
  private readonly apiUrl = 'http://localhost:3002/api/students';

  constructor(private readonly http: HttpClient) {}

  getStudents(search = ''): Observable<Student[]> {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<Student[]>(this.apiUrl, { params });
  }

  createStudent(payload: CreateStudentPayload): Observable<Student> {
    return this.http.post<Student>(this.apiUrl, payload);
  }

  updateStudent(
    id: string,
    payload: Partial<CreateStudentPayload>,
  ): Observable<Student> {
    return this.http.patch<Student>(`${this.apiUrl}/${id}`, payload);
  }

  deleteStudent(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
