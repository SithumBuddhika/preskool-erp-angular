import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  CreateSyllabusSubjectGroupPayload,
  SyllabusSubjectGroup,
  UpdateSyllabusSubjectGroupPayload,
} from '../models/syllabus-subject-group.model';

@Injectable({
  providedIn: 'root',
})
export class SyllabusSubjectGroupsService {
  private readonly apiUrl = 'http://localhost:3003/api/syllabus-subject-groups';

  constructor(private readonly http: HttpClient) {}

  getSyllabusSubjectGroups(search = ''): Observable<SyllabusSubjectGroup[]> {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<SyllabusSubjectGroup[]>(this.apiUrl, { params });
  }

  createSyllabusSubjectGroup(
    payload: CreateSyllabusSubjectGroupPayload,
  ): Observable<SyllabusSubjectGroup> {
    return this.http.post<SyllabusSubjectGroup>(this.apiUrl, payload);
  }

  updateSyllabusSubjectGroup(
    id: string,
    payload: UpdateSyllabusSubjectGroupPayload,
  ): Observable<SyllabusSubjectGroup> {
    return this.http.patch<SyllabusSubjectGroup>(
      `${this.apiUrl}/${id}`,
      payload,
    );
  }

  deleteSyllabusSubjectGroup(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  generateNextGroupCode(): Observable<string> {
    return this.http
      .get<{ groupCode: string }>(`${this.apiUrl}/next-code`)
      .pipe(map((response) => response.groupCode));
  }
}
