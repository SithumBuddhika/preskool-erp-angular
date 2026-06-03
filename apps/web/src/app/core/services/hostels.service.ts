import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CreateHostelPayload, Hostel } from '../models/hostel.model';

@Injectable({
  providedIn: 'root',
})
export class HostelsService {
  private readonly apiUrl = 'http://localhost:3002/api/hostels';

  constructor(private readonly http: HttpClient) {}

  getHostels(search = ''): Observable<Hostel[]> {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<Hostel[]>(this.apiUrl, { params });
  }

  createHostel(payload: CreateHostelPayload): Observable<Hostel> {
    return this.http.post<Hostel>(this.apiUrl, payload);
  }

  updateHostel(
    id: string,
    payload: Partial<CreateHostelPayload>,
  ): Observable<Hostel> {
    return this.http.patch<Hostel>(`${this.apiUrl}/${id}`, payload);
  }

  deleteHostel(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  generateNextHostelCode(): Observable<string> {
    return this.http
      .get<{ hostelCode: string }>(`${this.apiUrl}/next-code`)
      .pipe(map((response) => response.hostelCode));
  }
}
