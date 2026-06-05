import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';
import {
  CreateTransportRoutePayload,
  TransportRoute,
} from '../models/transport-route.model';

@Injectable({
  providedIn: 'root',
})
export class TransportRoutesService {
  private readonly apiUrl = environment.peopleApiUrl + '/transport-routes';

  constructor(private readonly http: HttpClient) {}

  getRoutes(search = ''): Observable<TransportRoute[]> {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<TransportRoute[]>(this.apiUrl, { params });
  }

  createRoute(
    payload: CreateTransportRoutePayload,
  ): Observable<TransportRoute> {
    return this.http.post<TransportRoute>(this.apiUrl, payload);
  }

  updateRoute(
    id: string,
    payload: Partial<CreateTransportRoutePayload>,
  ): Observable<TransportRoute> {
    return this.http.patch<TransportRoute>(`${this.apiUrl}/${id}`, payload);
  }

  deleteRoute(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  generateNextRouteCode(): Observable<string> {
    return this.http
      .get<{ routeCode: string }>(`${this.apiUrl}/next-code`)
      .pipe(map((response) => response.routeCode));
  }
}

