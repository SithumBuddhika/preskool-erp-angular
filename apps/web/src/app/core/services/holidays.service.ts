import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';
import { CreateHolidayPayload, Holiday } from '../models/holiday.model';

@Injectable({
  providedIn: 'root',
})
export class HolidaysService {
  private readonly apiUrl = environment.peopleApiUrl + '/holidays';

  constructor(private readonly http: HttpClient) {}

  getHolidays(search = ''): Observable<Holiday[]> {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<Holiday[]>(this.apiUrl, { params });
  }

  createHoliday(payload: CreateHolidayPayload): Observable<Holiday> {
    return this.http.post<Holiday>(this.apiUrl, payload);
  }

  updateHoliday(
    id: string,
    payload: Partial<CreateHolidayPayload>,
  ): Observable<Holiday> {
    return this.http.patch<Holiday>(`${this.apiUrl}/${id}`, payload);
  }

  deleteHoliday(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  generateNextHolidayCode(): Observable<string> {
    return this.http
      .get<{ holidayCode: string }>(`${this.apiUrl}/next-code`)
      .pipe(map((response) => response.holidayCode));
  }
}

