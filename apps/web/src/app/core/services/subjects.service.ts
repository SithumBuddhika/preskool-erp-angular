import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { CreateSubjectPayload, Subject } from '../models/subject.model';

@Injectable({
  providedIn: 'root',
})
export class SubjectsService {
  private readonly apiUrl = environment.academicApiUrl + '/subjects';

  constructor(private readonly http: HttpClient) {}

  getSubjects(search = ''): Observable<Subject[]> {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<Subject[]>(this.apiUrl, { params });
  }

  createSubject(payload: CreateSubjectPayload): Observable<Subject> {
    return this.http.post<Subject>(this.apiUrl, payload);
  }

  updateSubject(
    id: string,
    payload: Partial<CreateSubjectPayload>,
  ): Observable<Subject> {
    return this.http.patch<Subject>(`${this.apiUrl}/${id}`, payload);
  }

  deleteSubject(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}

