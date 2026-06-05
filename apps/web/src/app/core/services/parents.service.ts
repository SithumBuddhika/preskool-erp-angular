import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { CreateParentPayload, Parent } from '../models/parent.model';

@Injectable({
  providedIn: 'root',
})
export class ParentsService {
  private readonly apiUrl = environment.peopleApiUrl + '/parents';

  constructor(private readonly http: HttpClient) {}

  getParents(search = ''): Observable<Parent[]> {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<Parent[]>(this.apiUrl, { params });
  }

  createParent(payload: CreateParentPayload): Observable<Parent> {
    return this.http.post<Parent>(this.apiUrl, payload);
  }

  updateParent(
    id: string,
    payload: Partial<CreateParentPayload>,
  ): Observable<Parent> {
    return this.http.patch<Parent>(`${this.apiUrl}/${id}`, payload);
  }

  deleteParent(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}

