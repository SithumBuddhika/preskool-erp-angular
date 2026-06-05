import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';
import { CreatePayrollPayload, Payroll } from '../models/payroll.model';

@Injectable({
  providedIn: 'root',
})
export class PayrollService {
  private readonly apiUrl = environment.peopleApiUrl + '/payroll';

  constructor(private readonly http: HttpClient) {}

  getPayrollRecords(search = ''): Observable<Payroll[]> {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<Payroll[]>(this.apiUrl, { params });
  }

  createPayrollRecord(payload: CreatePayrollPayload): Observable<Payroll> {
    return this.http.post<Payroll>(this.apiUrl, payload);
  }

  updatePayrollRecord(
    id: string,
    payload: Partial<CreatePayrollPayload>,
  ): Observable<Payroll> {
    return this.http.patch<Payroll>(`${this.apiUrl}/${id}`, payload);
  }

  deletePayrollRecord(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  generateNextPayrollCode(): Observable<string> {
    return this.http
      .get<{ payrollCode: string }>(`${this.apiUrl}/next-code`)
      .pipe(map((response) => response.payrollCode));
  }
}

