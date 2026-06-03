import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  CreateSchoolEventPayload,
  SchoolEvent,
} from '../models/school-event.model';

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  private readonly apiUrl = 'http://localhost:3002/api/events';

  constructor(private readonly http: HttpClient) {}

  getEvents(search = '', date = '', status = '') {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    if (date.trim()) {
      params = params.set('date', date.trim());
    }

    if (status.trim()) {
      params = params.set('status', status.trim());
    }

    return this.http.get<SchoolEvent[]>(this.apiUrl, { params });
  }

  getUpcomingEvents(limit = 5) {
    return this.http.get<SchoolEvent[]>(`${this.apiUrl}/upcoming`, {
      params: new HttpParams().set('limit', String(limit)),
    });
  }

  createEvent(payload: CreateSchoolEventPayload) {
    return this.http.post<SchoolEvent>(this.apiUrl, payload);
  }

  updateEvent(id: string, payload: Partial<CreateSchoolEventPayload>) {
    return this.http.patch<SchoolEvent>(`${this.apiUrl}/${id}`, payload);
  }

  deleteEvent(id: string) {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
