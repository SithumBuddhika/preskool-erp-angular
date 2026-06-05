import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';
import {
  CreateLibraryMemberPayload,
  LibraryMember,
} from '../models/library-member.model';

@Injectable({
  providedIn: 'root',
})
export class LibraryMembersService {
  private readonly apiUrl = environment.peopleApiUrl + '/library-members';

  constructor(private readonly http: HttpClient) {}

  getLibraryMembers(search = ''): Observable<LibraryMember[]> {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<LibraryMember[]>(this.apiUrl, { params });
  }

  createLibraryMember(
    payload: CreateLibraryMemberPayload,
  ): Observable<LibraryMember> {
    return this.http.post<LibraryMember>(this.apiUrl, payload);
  }

  updateLibraryMember(
    id: string,
    payload: Partial<CreateLibraryMemberPayload>,
  ): Observable<LibraryMember> {
    return this.http.patch<LibraryMember>(`${this.apiUrl}/${id}`, payload);
  }

  deleteLibraryMember(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  generateNextMemberCode(): Observable<string> {
    return this.http
      .get<{ memberCode: string }>(`${this.apiUrl}/next-code`)
      .pipe(map((response) => response.memberCode));
  }
}

