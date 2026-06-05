import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { CreateClassPayload, SchoolClass } from '../models/school-class.model';

@Injectable({
  providedIn: 'root',
})
export class ClassesService {
  private readonly apiUrl = environment.academicApiUrl + '/classes';

  constructor(private readonly http: HttpClient) {}

  getClasses(search = ''): Observable<SchoolClass[]> {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<SchoolClass[]>(this.apiUrl, { params });
  }

  createClass(payload: CreateClassPayload): Observable<SchoolClass> {
    return this.http.post<SchoolClass>(this.apiUrl, payload);
  }

  updateClass(
    id: string,
    payload: Partial<CreateClassPayload>,
  ): Observable<SchoolClass> {
    return this.http.patch<SchoolClass>(`${this.apiUrl}/${id}`, payload);
  }

  deleteClass(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}

