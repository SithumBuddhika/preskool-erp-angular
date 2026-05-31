import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ClassRoom, CreateClassRoomPayload } from '../models/class-room.model';

@Injectable({
  providedIn: 'root',
})
export class ClassRoomsService {
  private readonly apiUrl = 'http://localhost:3003/api/class-rooms';

  constructor(private readonly http: HttpClient) {}

  getClassRooms(search = ''): Observable<ClassRoom[]> {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<ClassRoom[]>(this.apiUrl, { params });
  }

  createClassRoom(payload: CreateClassRoomPayload): Observable<ClassRoom> {
    return this.http.post<ClassRoom>(this.apiUrl, payload);
  }

  updateClassRoom(
    id: string,
    payload: Partial<CreateClassRoomPayload>,
  ): Observable<ClassRoom> {
    return this.http.patch<ClassRoom>(`${this.apiUrl}/${id}`, payload);
  }

  deleteClassRoom(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
