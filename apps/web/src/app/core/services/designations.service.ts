import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  CreateDesignationPayload,
  Designation,
} from '../models/designation.model';

@Injectable({
  providedIn: 'root',
})
export class DesignationsService {
  private readonly apiUrl = 'http://localhost:3002/api/designations';

  constructor(private readonly http: HttpClient) {}

  getDesignations(search = ''): Observable<Designation[]> {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<Designation[]>(this.apiUrl, { params });
  }

  createDesignation(
    payload: CreateDesignationPayload,
  ): Observable<Designation> {
    return this.http.post<Designation>(this.apiUrl, payload);
  }

  updateDesignation(
    id: string,
    payload: Partial<CreateDesignationPayload>,
  ): Observable<Designation> {
    return this.http.patch<Designation>(`${this.apiUrl}/${id}`, payload);
  }

  deleteDesignation(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  generateNextDesignationCode(): Observable<string> {
    return this.http
      .get<{ designationCode: string }>(`${this.apiUrl}/next-code`)
      .pipe(map((response) => response.designationCode));
  }
}
