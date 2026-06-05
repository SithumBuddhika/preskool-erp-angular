import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';

export type TeacherDashboardStatCard = {
  short: string;
  label: string;
  value: string;
  subLabel: string;
  color: string;
};

export type TeacherDashboardAttendanceSummary = {
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  total: number;
  rate: number;
};

export type TeacherDashboardEventItem = {
  id: string;
  title: string;
  eventType: string;
  audience: string;
  startDate: string;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  description?: string | null;
};

export type TeacherDashboardCalendarItem = TeacherDashboardEventItem & {
  dateKey: string;
};

export type TeacherDashboardRoutineItem = {
  id: string;
  classLabel: string;
  subjectName: string;
  teacherName: string;
  day: string;
  startTime: string;
  endTime: string;
  roomName: string;
};

export type TeacherDashboardSubjectSummary = {
  totalSubjects: number;
  assignedSubjects: number;
  activeSubjects: number;
};

export type TeacherDashboardRecentAttendance = {
  id: string;
  teacherName: string;
  employeeNo: string;
  subject: string;
  attendanceDate: string;
  status: string;
  remarks?: string | null;
};

export type TeacherDashboardLeaveItem = {
  id: string;
  staffName: string;
  designation: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
};

export type TeacherDashboardData = {
  statCards: TeacherDashboardStatCard[];
  attendanceSummary: TeacherDashboardAttendanceSummary;
  subjectSummary: TeacherDashboardSubjectSummary;
  todayRoutines: TeacherDashboardRoutineItem[];
  upcomingEvents: TeacherDashboardEventItem[];
  calendarEvents: TeacherDashboardCalendarItem[];
  recentAttendance: TeacherDashboardRecentAttendance[];
  recentLeaves: TeacherDashboardLeaveItem[];
};

type StatusEntity = {
  status?: string;
};

type SubjectRecord = {
  status?: string;
  teacherName?: string | null;
  assignedTeacherName?: string | null;
  teacherId?: string | null;
};

type ClassRoutineRecord = {
  [key: string]: string | number | null | undefined;
  id?: string;
  className?: string;
  section?: string | null;
  subjectName?: string;
  subject?: string;
  teacherName?: string;
  day?: string;
  routineDay?: string;
  weekDay?: string;
  startTime?: string;
  endTime?: string;
  roomName?: string;
  room?: string;
};

type TeacherAttendanceRecord = {
  id: string;
  attendanceCode?: string;
  teacherName?: string;
  teacherEmployeeNo?: string | null;
  subject?: string | null;
  attendanceDate?: string;
  status?: string;
  remarks?: string | null;
};

type SchoolEventRecord = {
  id: string;
  title: string;
  eventType?: string;
  audience?: string;
  startDate: string;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  description?: string | null;
  status?: string;
};

type LeaveRecord = {
  id?: string;
  staffName?: string;
  designation?: string | null;
  leaveType?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  createdAt?: string;
};

@Injectable({
  providedIn: 'root',
})
export class TeacherDashboardDataService {
  private readonly peopleApiUrl = environment.peopleApiUrl + '';
  private readonly academicApiUrl = environment.academicApiUrl + '';

  constructor(private readonly http: HttpClient) {}

  getDashboardData(): Observable<TeacherDashboardData> {
    return forkJoin({
      teachers: this.safeGet<StatusEntity>(`${this.peopleApiUrl}/teachers`),
      subjects: this.safeGet<SubjectRecord>(`${this.academicApiUrl}/subjects`),
      routines: this.safeGet<ClassRoutineRecord>(
        `${this.academicApiUrl}/class-routine`,
      ),
      teacherAttendance: this.safeGet<TeacherAttendanceRecord>(
        `${this.peopleApiUrl}/teacher-attendance`,
      ),
      events: this.safeGet<SchoolEventRecord>(`${this.peopleApiUrl}/events`),
      leaves: this.safeGet<LeaveRecord>(`${this.peopleApiUrl}/leaves`),
    }).pipe(
      map((data) => {
        const attendanceSummary = this.buildAttendanceSummary(
          data.teacherAttendance,
        );

        const upcomingEvents = this.buildUpcomingEvents(data.events);
        const todayRoutines = this.buildTodayRoutines(data.routines);

        return {
          statCards: [
            {
              short: 'T',
              label: 'Total Teachers',
              value: String(data.teachers.length),
              subLabel: `${this.countActive(data.teachers)} active records`,
              color: 'is-blue',
            },
            {
              short: 'SB',
              label: 'Subjects',
              value: String(data.subjects.length),
              subLabel: 'Available teaching subjects',
              color: 'is-purple',
            },
            {
              short: 'CR',
              label: 'Today Routines',
              value: String(todayRoutines.length),
              subLabel: 'Class routine records',
              color: 'is-orange',
            },
            {
              short: 'EV',
              label: 'Upcoming Events',
              value: String(upcomingEvents.length),
              subLabel: 'Active schedule items',
              color: 'is-green',
            },
          ],
          attendanceSummary,
          subjectSummary: this.buildSubjectSummary(data.subjects),
          todayRoutines,
          upcomingEvents,
          calendarEvents: this.buildCalendarEvents(data.events),
          recentAttendance: this.buildRecentAttendance(data.teacherAttendance),
          recentLeaves: this.buildRecentLeaves(data.leaves),
        };
      }),
    );
  }

  private safeGet<T>(url: string): Observable<T[]> {
    return this.http.get<T[]>(url).pipe(catchError(() => of([] as T[])));
  }

  private countActive(records: StatusEntity[]): number {
    return records.filter((record) => record.status === 'ACTIVE').length;
  }

  private buildAttendanceSummary(
    records: TeacherAttendanceRecord[],
  ): TeacherDashboardAttendanceSummary {
    const today = this.getTodayDate();

    const todayRecords = records.filter((record) =>
      record.attendanceDate?.startsWith(today),
    );

    const present = todayRecords.filter(
      (record) => record.status === 'PRESENT',
    ).length;

    const total = todayRecords.length;

    return {
      present,
      absent: todayRecords.filter((record) => record.status === 'ABSENT')
        .length,
      late: todayRecords.filter((record) => record.status === 'LATE').length,
      halfDay: todayRecords.filter((record) => record.status === 'HALF_DAY')
        .length,
      total,
      rate: total > 0 ? Math.round((present / total) * 100) : 0,
    };
  }

  private buildSubjectSummary(
    subjects: SubjectRecord[],
  ): TeacherDashboardSubjectSummary {
    const assignedSubjects = subjects.filter(
      (subject) =>
        !!subject.teacherName ||
        !!subject.assignedTeacherName ||
        !!subject.teacherId,
    ).length;

    return {
      totalSubjects: subjects.length,
      assignedSubjects,
      activeSubjects: subjects.filter((subject) => subject.status === 'ACTIVE')
        .length,
    };
  }

  private buildTodayRoutines(
    routines: ClassRoutineRecord[],
  ): TeacherDashboardRoutineItem[] {
    const todayName = new Date()
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase();

    return routines
      .filter((routine) => {
        const routineDay = String(
          routine.day || routine.routineDay || routine.weekDay || '',
        ).toLowerCase();

        return !routineDay || routineDay.includes(todayName.slice(0, 3));
      })
      .sort((a, b) =>
        String(a.startTime || '').localeCompare(String(b.startTime || '')),
      )
      .slice(0, 6)
      .map((routine, index) => ({
        id: String(routine.id || `routine-${index}`),
        classLabel: `${String(
          routine.className || routine['class'] || 'Class',
        )} ${String(routine.section || '')}`.trim(),
        subjectName: String(
          routine.subjectName ||
            routine.subject ||
            routine['subjectTitle'] ||
            'Subject',
        ),
        teacherName: String(routine.teacherName || 'Assigned Teacher'),
        day: String(
          routine.day || routine.routineDay || routine.weekDay || 'Today',
        ),
        startTime: String(routine.startTime || 'Not set'),
        endTime: String(routine.endTime || 'Not set'),
        roomName: String(routine.roomName || routine.room || 'No room'),
      }));
  }

  private buildUpcomingEvents(
    events: SchoolEventRecord[],
  ): TeacherDashboardEventItem[] {
    const today = this.getTodayDate();

    return events
      .filter((event) => event.status !== 'INACTIVE')
      .filter((event) => {
        const endDate = event.endDate ? this.toDateKey(event.endDate) : null;
        const startDate = this.toDateKey(event.startDate);

        return (endDate || startDate) >= today;
      })
      .sort((a, b) =>
        this.toDateKey(a.startDate).localeCompare(this.toDateKey(b.startDate)),
      )
      .slice(0, 5)
      .map((event) => this.mapEvent(event));
  }

  private buildCalendarEvents(
    events: SchoolEventRecord[],
  ): TeacherDashboardCalendarItem[] {
    return events
      .filter((event) => event.status !== 'INACTIVE')
      .flatMap((event) => this.expandEventForCalendar(event));
  }

  private expandEventForCalendar(
    event: SchoolEventRecord,
  ): TeacherDashboardCalendarItem[] {
    const startKey = this.toDateKey(event.startDate);
    const endKey = this.toDateKey(event.endDate || event.startDate);

    if (!startKey) {
      return [];
    }

    const start = new Date(`${startKey}T00:00:00`);
    const end = new Date(`${endKey || startKey}T00:00:00`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return [{ ...this.mapEvent(event), dateKey: startKey }];
    }

    const days: TeacherDashboardCalendarItem[] = [];
    const cursor = new Date(start);
    let guard = 0;

    while (cursor <= end && guard < 45) {
      const dateKey = cursor.toISOString().slice(0, 10);

      days.push({
        ...this.mapEvent(event),
        dateKey,
      });

      cursor.setDate(cursor.getDate() + 1);
      guard += 1;
    }

    return days;
  }

  private mapEvent(event: SchoolEventRecord): TeacherDashboardEventItem {
    return {
      id: event.id,
      title: event.title,
      eventType: event.eventType || 'GENERAL',
      audience: event.audience || 'ALL',
      startDate: event.startDate,
      endDate: event.endDate,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      description: event.description,
    };
  }

  private buildRecentAttendance(
    records: TeacherAttendanceRecord[],
  ): TeacherDashboardRecentAttendance[] {
    return [...records]
      .sort((a, b) => {
        const aTime = new Date(a.attendanceDate || '').getTime();
        const bTime = new Date(b.attendanceDate || '').getTime();

        return bTime - aTime;
      })
      .slice(0, 6)
      .map((record) => ({
        id: record.id,
        teacherName: record.teacherName || 'Unknown Teacher',
        employeeNo: record.teacherEmployeeNo || record.attendanceCode || 'N/A',
        subject: record.subject || 'No subject',
        attendanceDate: record.attendanceDate || '',
        status: record.status || 'N/A',
        remarks: record.remarks,
      }));
  }

  private buildRecentLeaves(
    leaves: LeaveRecord[],
  ): TeacherDashboardLeaveItem[] {
    return [...leaves]
      .sort((a, b) => {
        const aTime = new Date(a.createdAt || a.startDate || '').getTime();
        const bTime = new Date(b.createdAt || b.startDate || '').getTime();

        return bTime - aTime;
      })
      .slice(0, 4)
      .map((leave, index) => ({
        id: leave.id || `leave-${index}`,
        staffName: leave.staffName || 'Staff Member',
        designation: leave.designation || 'School Staff',
        leaveType: leave.leaveType || 'OTHER',
        startDate: leave.startDate || '',
        endDate: leave.endDate || '',
        status: leave.status || 'PENDING',
      }));
  }

  private toDateKey(date?: string | null): string {
    if (!date) {
      return '';
    }

    if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
      return date.slice(0, 10);
    }

    return new Date(date).toISOString().slice(0, 10);
  }

  private getTodayDate(): string {
    const today = new Date();

    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(today.getDate()).padStart(2, '0')}`;
  }
}

