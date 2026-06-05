import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';
import { CreateTeacherPayload, Teacher } from '../models/teacher.model';

@Injectable({
  providedIn: 'root',
})
export class TeachersService {
  private readonly apiUrl = environment.peopleApiUrl + '/teachers';

  constructor(private readonly http: HttpClient) {}

  getTeachers(search = ''): Observable<Teacher[]> {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<Teacher[]>(this.apiUrl, { params });
  }

  createTeacher(payload: CreateTeacherPayload): Observable<Teacher> {
    return this.http.post<Teacher>(this.apiUrl, payload);
  }

  updateTeacher(
    id: string,
    payload: Partial<CreateTeacherPayload>,
  ): Observable<Teacher> {
    return this.http.patch<Teacher>(`${this.apiUrl}/${id}`, payload);
  }

  deleteTeacher(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  generateNextEmployeeNo(): Observable<string> {
    return this.http
      .get<{ employeeNo: string }>(`${this.apiUrl}/next-code`)
      .pipe(map((response) => response.employeeNo));
  }
}

