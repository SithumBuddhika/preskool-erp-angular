import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  ClassRoutine,
  CreateClassRoutinePayload,
  UpdateClassRoutinePayload,
} from '../models/class-routine.model';

@Injectable({
  providedIn: 'root',
})
export class ClassRoutinesService {
  private readonly storageKey = 'preskool_class_routines';

  getClassRoutines(search = ''): Observable<ClassRoutine[]> {
    const keyword = search.trim().toLowerCase();
    const routines = this.readClassRoutines();

    if (!keyword) {
      return of(routines);
    }

    const filteredRoutines = routines.filter((routine) => {
      const searchableText = [
        routine.routineCode,
        routine.className,
        routine.section,
        routine.subjectName,
        routine.teacherName,
        routine.roomNo,
        routine.day,
        routine.startTime,
        routine.endTime,
        routine.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(keyword);
    });

    return of(filteredRoutines);
  }

  createClassRoutine(
    payload: CreateClassRoutinePayload,
  ): Observable<ClassRoutine> {
    const routines = this.readClassRoutines();

    const newRoutine: ClassRoutine = {
      id: Date.now(),
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.writeClassRoutines([newRoutine, ...routines]);

    return of(newRoutine);
  }

  updateClassRoutine(
    routineId: number,
    payload: UpdateClassRoutinePayload,
  ): Observable<ClassRoutine> {
    const routines = this.readClassRoutines();

    const updatedRoutines = routines.map((routine) => {
      if (routine.id !== routineId) {
        return routine;
      }

      return {
        ...routine,
        ...payload,
        updatedAt: new Date().toISOString(),
      };
    });

    this.writeClassRoutines(updatedRoutines);

    const updatedRoutine = updatedRoutines.find(
      (routine) => routine.id === routineId,
    );

    return of(updatedRoutine as ClassRoutine);
  }

  deleteClassRoutine(routineId: number): Observable<void> {
    const routines = this.readClassRoutines();

    const updatedRoutines = routines.filter(
      (routine) => routine.id !== routineId,
    );

    this.writeClassRoutines(updatedRoutines);

    return of(void 0);
  }

  generateNextRoutineCode(): string {
    const routines = this.readClassRoutines();

    const highestNumber = routines.reduce((highest, routine) => {
      const match = routine.routineCode?.match(/\d+/);
      const codeNumber = match ? Number(match[0]) : 0;

      return codeNumber > highest ? codeNumber : highest;
    }, 0);

    return `RTN-${String(highestNumber + 1).padStart(4, '0')}`;
  }

  private readClassRoutines(): ClassRoutine[] {
    try {
      const storedValue = localStorage.getItem(this.storageKey);

      if (!storedValue) {
        return this.getDefaultClassRoutines();
      }

      const routines = JSON.parse(storedValue) as Partial<ClassRoutine>[];

      return routines.map((routine, index) => ({
        id: routine.id || Date.now() + index,
        routineCode:
          routine.routineCode || `RTN-${String(index + 1).padStart(4, '0')}`,
        className: routine.className || '',
        section:
          routine.section ||
          this.extractSectionFromClassName(routine.className || ''),
        subjectName: routine.subjectName || '',
        teacherName: routine.teacherName || '',
        roomNo: routine.roomNo || '',
        day: routine.day || 'MONDAY',
        startTime: routine.startTime || '',
        endTime: routine.endTime || '',
        status: routine.status || 'ACTIVE',
        createdAt: routine.createdAt || new Date().toISOString(),
        updatedAt: routine.updatedAt || new Date().toISOString(),
      }));
    } catch {
      return this.getDefaultClassRoutines();
    }
  }

  private writeClassRoutines(routines: ClassRoutine[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(routines));
  }

  private extractSectionFromClassName(className: string): string {
    const parts = className.trim().split(' ');
    return parts.length > 0 ? parts[parts.length - 1] : '';
  }

  private getDefaultClassRoutines(): ClassRoutine[] {
    return [
      {
        id: 1,
        routineCode: 'RTN-0001',
        className: 'Grade 8 A',
        section: 'A',
        subjectName: 'Mathematics',
        teacherName: 'Amali Silva',
        roomNo: 'R-201',
        day: 'MONDAY',
        startTime: '08:00',
        endTime: '08:45',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }
}
