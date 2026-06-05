import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { CreateGuardianPayload, Guardian } from '../models/guardian.model';

@Injectable({
  providedIn: 'root',
})
export class GuardiansService {
  private readonly apiUrl = environment.peopleApiUrl + '/guardians';

  constructor(private readonly http: HttpClient) {}

  getGuardians(search = ''): Observable<Guardian[]> {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<Guardian[]>(this.apiUrl, { params });
  }

  createGuardian(payload: CreateGuardianPayload): Observable<Guardian> {
    return this.http.post<Guardian>(this.apiUrl, payload);
  }

  updateGuardian(
    id: string,
    payload: Partial<CreateGuardianPayload>,
  ): Observable<Guardian> {
    return this.http.patch<Guardian>(`${this.apiUrl}/${id}`, payload);
  }

  deleteGuardian(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}

