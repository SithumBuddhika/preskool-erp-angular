import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';
import { CreateFeeGroupPayload, FeeGroup } from '../models/fee-group.model';

@Injectable({
  providedIn: 'root',
})
export class FeeGroupsService {
  private readonly apiUrl = environment.peopleApiUrl + '/fee-groups';

  constructor(private readonly http: HttpClient) {}

  getFeeGroups(search = ''): Observable<FeeGroup[]> {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<FeeGroup[]>(this.apiUrl, { params });
  }

  createFeeGroup(payload: CreateFeeGroupPayload): Observable<FeeGroup> {
    return this.http.post<FeeGroup>(this.apiUrl, payload);
  }

  updateFeeGroup(
    id: string,
    payload: Partial<CreateFeeGroupPayload>,
  ): Observable<FeeGroup> {
    return this.http.patch<FeeGroup>(`${this.apiUrl}/${id}`, payload);
  }

  deleteFeeGroup(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  generateNextFeeGroupCode(): Observable<string> {
    return this.http
      .get<{ feeGroupCode: string }>(`${this.apiUrl}/next-code`)
      .pipe(map((response) => response.feeGroupCode));
  }
}

