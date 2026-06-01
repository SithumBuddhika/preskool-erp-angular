import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  CreateDepartmentPayload,
  Department,
} from '../models/department.model';

@Injectable({
  providedIn: 'root',
})
export class DepartmentsService {
  private readonly apiUrl = 'http://localhost:3002/api/departments';

  constructor(private readonly http: HttpClient) {}

  getDepartments(search = ''): Observable<Department[]> {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<Department[]>(this.apiUrl, { params });
  }

  createDepartment(payload: CreateDepartmentPayload): Observable<Department> {
    return this.http.post<Department>(this.apiUrl, payload);
  }

  updateDepartment(
    id: string,
    payload: Partial<CreateDepartmentPayload>,
  ): Observable<Department> {
    return this.http.patch<Department>(`${this.apiUrl}/${id}`, payload);
  }

  deleteDepartment(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  generateNextDepartmentCode(): Observable<string> {
    return this.http
      .get<{ departmentCode: string }>(`${this.apiUrl}/next-code`)
      .pipe(map((response) => response.departmentCode));
  }
}
