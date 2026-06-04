import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';

export type ParentDashboardStatCard = {
  short: string;
  label: string;
  value: string;
  subLabel: string;
  color: string;
};

export type ParentDashboardAttendanceSummary = {
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  total: number;
  rate: number;
};

export type ParentDashboardFeeSummary = {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paidCount: number;
  pendingCount: number;
};

export type ParentDashboardEventItem = {
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

export type ParentDashboardCalendarItem = ParentDashboardEventItem & {
  dateKey: string;
};

export type ParentDashboardChildSummary = {
  totalStudents: number;
  activeStudents: number;
  totalParents: number;
  totalGuardians: number;
};

export type ParentDashboardLibrarySummary = {
  books: number;
  members: number;
};

export type ParentDashboardRecentAttendance = {
  id: string;
  studentName: string;
  admissionNo: string;
  className: string;
  attendanceDate: string;
  status: string;
  remarks?: string | null;
};

export type ParentDashboardData = {
  statCards: ParentDashboardStatCard[];
  attendanceSummary: ParentDashboardAttendanceSummary;
  feeSummary: ParentDashboardFeeSummary;
  childSummary: ParentDashboardChildSummary;
  librarySummary: ParentDashboardLibrarySummary;
  upcomingEvents: ParentDashboardEventItem[];
  calendarEvents: ParentDashboardCalendarItem[];
  recentAttendance: ParentDashboardRecentAttendance[];
};

type StatusEntity = {
  status?: string;
};

type StudentRecord = {
  status?: string;
};

type StudentAttendanceRecord = {
  id: string;
  studentName?: string;
  studentAdmissionNo?: string | null;
  className?: string;
  section?: string | null;
  attendanceDate?: string;
  status?: string;
  remarks?: string | null;
};

type FeeRecord = {
  amount?: number;
  paidAmount?: number;
  balance?: number;
  paymentStatus?: string;
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

@Injectable({
  providedIn: 'root',
})
export class ParentDashboardDataService {
  private readonly peopleApiUrl = 'http://localhost:3002/api';

  constructor(private readonly http: HttpClient) {}

  getDashboardData(): Observable<ParentDashboardData> {
    return forkJoin({
      parents: this.safeGet<StatusEntity>(`${this.peopleApiUrl}/parents`),
      students: this.safeGet<StudentRecord>(`${this.peopleApiUrl}/students`),
      guardians: this.safeGet<StatusEntity>(`${this.peopleApiUrl}/guardians`),
      fees: this.safeGet<FeeRecord>(`${this.peopleApiUrl}/fees`),
      libraryBooks: this.safeGet<unknown>(`${this.peopleApiUrl}/library`),
      libraryMembers: this.safeGet<unknown>(
        `${this.peopleApiUrl}/library-members`,
      ),
      studentAttendance: this.safeGet<StudentAttendanceRecord>(
        `${this.peopleApiUrl}/student-attendance`,
      ),
      events: this.safeGet<SchoolEventRecord>(`${this.peopleApiUrl}/events`),
    }).pipe(
      map((data) => {
        const attendanceSummary = this.buildAttendanceSummary(
          data.studentAttendance,
        );
        const feeSummary = this.buildFeeSummary(data.fees);
        const upcomingEvents = this.buildUpcomingEvents(data.events);
        const childSummary = {
          totalStudents: data.students.length,
          activeStudents: this.countActive(data.students),
          totalParents: data.parents.length,
          totalGuardians: data.guardians.length,
        };

        return {
          statCards: [
            {
              short: 'CH',
              label: 'Students',
              value: String(data.students.length),
              subLabel: `${childSummary.activeStudents} active student records`,
              color: 'is-blue',
            },
            {
              short: 'AT',
              label: 'Today Attendance',
              value: `${attendanceSummary.rate}%`,
              subLabel: `${attendanceSummary.present} present records today`,
              color: 'is-green',
            },
            {
              short: 'FE',
              label: 'Pending Fees',
              value: String(feeSummary.pendingCount),
              subLabel: `${this.formatMoney(feeSummary.pendingAmount)} pending`,
              color: 'is-orange',
            },
            {
              short: 'EV',
              label: 'Upcoming Events',
              value: String(upcomingEvents.length),
              subLabel: 'Active school schedule items',
              color: 'is-purple',
            },
          ],
          attendanceSummary,
          feeSummary,
          childSummary,
          librarySummary: {
            books: data.libraryBooks.length,
            members: data.libraryMembers.length,
          },
          upcomingEvents,
          calendarEvents: this.buildCalendarEvents(data.events),
          recentAttendance: this.buildRecentAttendance(data.studentAttendance),
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
    records: StudentAttendanceRecord[],
  ): ParentDashboardAttendanceSummary {
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

  private buildFeeSummary(fees: FeeRecord[]): ParentDashboardFeeSummary {
    return fees.reduce<ParentDashboardFeeSummary>(
      (summary, fee) => ({
        totalAmount: summary.totalAmount + Number(fee.amount || 0),
        paidAmount: summary.paidAmount + Number(fee.paidAmount || 0),
        pendingAmount: summary.pendingAmount + Number(fee.balance || 0),
        paidCount: summary.paidCount + (fee.paymentStatus === 'PAID' ? 1 : 0),
        pendingCount:
          summary.pendingCount +
          (fee.paymentStatus === 'PENDING' || fee.paymentStatus === 'PARTIAL'
            ? 1
            : 0),
      }),
      {
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        paidCount: 0,
        pendingCount: 0,
      },
    );
  }

  private buildUpcomingEvents(
    events: SchoolEventRecord[],
  ): ParentDashboardEventItem[] {
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
  ): ParentDashboardCalendarItem[] {
    return events
      .filter((event) => event.status !== 'INACTIVE')
      .flatMap((event) => this.expandEventForCalendar(event));
  }

  private expandEventForCalendar(
    event: SchoolEventRecord,
  ): ParentDashboardCalendarItem[] {
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

    const days: ParentDashboardCalendarItem[] = [];
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

  private mapEvent(event: SchoolEventRecord): ParentDashboardEventItem {
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
    records: StudentAttendanceRecord[],
  ): ParentDashboardRecentAttendance[] {
    return [...records]
      .sort((a, b) => {
        const aTime = new Date(a.attendanceDate || '').getTime();
        const bTime = new Date(b.attendanceDate || '').getTime();

        return bTime - aTime;
      })
      .slice(0, 6)
      .map((record) => ({
        id: record.id,
        studentName: record.studentName || 'Unknown Student',
        admissionNo: record.studentAdmissionNo || 'N/A',
        className: `${record.className || ''} ${record.section || ''}`.trim(),
        attendanceDate: record.attendanceDate || '',
        status: record.status || 'N/A',
        remarks: record.remarks,
      }));
  }

  private formatMoney(value: number): string {
    return `Rs. ${new Intl.NumberFormat('en-LK').format(Math.round(value))}`;
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
