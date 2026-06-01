import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CreateLibraryBookPayload, LibraryBook } from '../models/library.model';

@Injectable({
  providedIn: 'root',
})
export class LibraryService {
  private readonly apiUrl = 'http://localhost:3002/api/library';

  constructor(private readonly http: HttpClient) {}

  getBooks(search = ''): Observable<LibraryBook[]> {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<LibraryBook[]>(this.apiUrl, { params });
  }

  createBook(payload: CreateLibraryBookPayload): Observable<LibraryBook> {
    return this.http.post<LibraryBook>(this.apiUrl, payload);
  }

  updateBook(
    id: string,
    payload: Partial<CreateLibraryBookPayload>,
  ): Observable<LibraryBook> {
    return this.http.patch<LibraryBook>(`${this.apiUrl}/${id}`, payload);
  }

  deleteBook(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  generateNextBookCode(): Observable<string> {
    return this.http
      .get<{ bookCode: string }>(`${this.apiUrl}/next-code`)
      .pipe(map((response) => response.bookCode));
  }
}
