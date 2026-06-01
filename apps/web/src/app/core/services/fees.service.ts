import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CreateFeePayload, Fee } from '../models/fee.model';

@Injectable({
  providedIn: 'root',
})
export class FeesService {
  private readonly apiUrl = 'http://localhost:3002/api/fees';

  constructor(private readonly http: HttpClient) {}

  getFees(search = ''): Observable<Fee[]> {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<Fee[]>(this.apiUrl, { params });
  }

  createFee(payload: CreateFeePayload): Observable<Fee> {
    return this.http.post<Fee>(this.apiUrl, payload);
  }

  updateFee(id: string, payload: Partial<CreateFeePayload>): Observable<Fee> {
    return this.http.patch<Fee>(`${this.apiUrl}/${id}`, payload);
  }

  deleteFee(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  generateNextReceiptNo(): Observable<string> {
    return this.http
      .get<{ receiptNo: string }>(`${this.apiUrl}/next-code`)
      .pipe(map((response) => response.receiptNo));
  }
}
