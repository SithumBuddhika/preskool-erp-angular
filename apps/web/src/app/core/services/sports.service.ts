import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';
import { CreateSportPayload, Sport } from '../models/sport.model';

@Injectable({
  providedIn: 'root',
})
export class SportsService {
  private readonly apiUrl = environment.peopleApiUrl + '/sports';

  constructor(private readonly http: HttpClient) {}

  getSports(search = ''): Observable<Sport[]> {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<Sport[]>(this.apiUrl, { params });
  }

  createSport(payload: CreateSportPayload): Observable<Sport> {
    return this.http.post<Sport>(this.apiUrl, payload);
  }

  updateSport(
    id: string,
    payload: Partial<CreateSportPayload>,
  ): Observable<Sport> {
    return this.http.patch<Sport>(`${this.apiUrl}/${id}`, payload);
  }

  deleteSport(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  generateNextSportCode(): Observable<string> {
    return this.http
      .get<{ sportCode: string }>(`${this.apiUrl}/next-code`)
      .pipe(map((response) => response.sportCode));
  }
}

