import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';

export type DashboardStatCard = {
  short: string;
  label: string;
  value: string;
  badge: string;
  active: string;
  inactive: string;
  color: string;
};

export type DashboardFeeBar = {
  label: string;
  collected: number;
};

export type DashboardFeeSummary = {
  totalAmount: number;
  collectedAmount: number;
  pendingAmount: number;
  paidCount: number;
  pendingCount: number;
};

export type DashboardAttendanceSummary = {
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  total: number;
};

export type DashboardAttendanceType = 'STUDENTS' | 'TEACHERS' | 'STAFF';

export type DashboardAttendanceGroupSummaries = {
  students: DashboardAttendanceSummary;
  teachers: DashboardAttendanceSummary;
  staff: DashboardAttendanceSummary;
};

export type DashboardQuickSummary = {
  libraryBooks: number;
  libraryMembers: number;
  routes: number;
  hostels: number;
  sports: number;
  events: number;
  availableBeds: number;
  sportParticipants: number;
};

export type DashboardRecentLeave = {
  staffName: string;
  designation?: string | null;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
};

export type DashboardCalendarItem = {
  id: string;
  type: 'EVENT' | 'HOLIDAY' | 'LEAVE';
  title: string;
  subTitle?: string;
  startDate: string;
  endDate?: string | null;
  dateKey: string;
  time?: string;
  status?: string;
  eventType?: string;
};

export type AdminDashboardData = {
  statCards: DashboardStatCard[];
  feeBars: DashboardFeeBar[];
  feeSummary: DashboardFeeSummary;
  attendanceSummary: DashboardAttendanceSummary;
  attendanceSummaries: DashboardAttendanceGroupSummaries;
  quickSummary: DashboardQuickSummary;
  recentLeaves: DashboardRecentLeave[];
  upcomingItems: DashboardCalendarItem[];
  calendarItems: DashboardCalendarItem[];
};

type StatusEntity = {
  status?: string;
};

type FeeRecord = {
  amount?: number;
  paidAmount?: number;
  balance?: number;
  paymentStatus?: string;
  paidDate?: string | null;
  createdAt?: string;
};

type AttendanceRecord = {
  status?: string;
  attendanceDate?: string;
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

type HostelRecord = {
  availableBeds?: number;
};

type SportRecord = {
  currentParticipants?: number;
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
  organizer?: string | null;
  description?: string | null;
  status?: string;
};

type HolidayRecord = {
  id?: string;
  holidayCode?: string;
  holidayName?: string;
  title?: string;
  holidayDate?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  holidayType?: string;
  description?: string | null;
  status?: string;
};

@Injectable({
  providedIn: 'root',
})
export class AdminDashboardDataService {
  private readonly peopleApiUrl = environment.peopleApiUrl + '';
  private readonly academicApiUrl = environment.academicApiUrl + '';

  constructor(private readonly http: HttpClient) {}

  getDashboardData(): Observable<AdminDashboardData> {
    return forkJoin({
      students: this.safeGet<StatusEntity>(`${this.peopleApiUrl}/students`),
      teachers: this.safeGet<StatusEntity>(`${this.peopleApiUrl}/teachers`),
      staffs: this.safeGet<StatusEntity>(`${this.peopleApiUrl}/staffs`),
      subjects: this.safeGet<StatusEntity>(`${this.academicApiUrl}/subjects`),

      fees: this.safeGet<FeeRecord>(`${this.peopleApiUrl}/fees`),
      libraryBooks: this.safeGet<unknown>(`${this.peopleApiUrl}/library`),
      libraryMembers: this.safeGet<unknown>(
        `${this.peopleApiUrl}/library-members`,
      ),
      routes: this.safeGet<unknown>(`${this.peopleApiUrl}/transport-routes`),
      hostels: this.safeGet<HostelRecord>(`${this.peopleApiUrl}/hostels`),
      sports: this.safeGet<SportRecord>(`${this.peopleApiUrl}/sports`),

      events: this.safeGet<SchoolEventRecord>(`${this.peopleApiUrl}/events`),
      holidays: this.safeGet<HolidayRecord>(`${this.peopleApiUrl}/holidays`),
      leaves: this.safeGet<LeaveRecord>(`${this.peopleApiUrl}/leaves`),

      studentAttendance: this.safeGet<AttendanceRecord>(
        `${this.peopleApiUrl}/student-attendance`,
      ),
      teacherAttendance: this.safeGet<AttendanceRecord>(
        `${this.peopleApiUrl}/teacher-attendance`,
      ),
      staffAttendance: this.safeGet<AttendanceRecord>(
        `${this.peopleApiUrl}/staff-attendance`,
      ),
    }).pipe(
      map((data) => {
        const calendarItems = this.buildCalendarItems(
          data.events,
          data.holidays,
          data.leaves,
        );

        const studentAttendanceSummary = this.buildAttendanceSummary(
          data.studentAttendance,
        );
        const teacherAttendanceSummary = this.buildAttendanceSummary(
          data.teacherAttendance,
        );
        const staffAttendanceSummary = this.buildAttendanceSummary(
          data.staffAttendance,
        );

        const attendanceSummaries: DashboardAttendanceGroupSummaries = {
          students: studentAttendanceSummary,
          teachers: teacherAttendanceSummary,
          staff: staffAttendanceSummary,
        };

        return {
          statCards: [
            this.buildStatCard(
              'S',
              'Total Students',
              data.students,
              'is-orange',
            ),
            this.buildStatCard('T', 'Total Teachers', data.teachers, 'is-blue'),
            this.buildStatCard('SF', 'Total Staff', data.staffs, 'is-green'),
            this.buildStatCard(
              'SB',
              'Total Subjects',
              data.subjects,
              'is-purple',
            ),
          ],
          feeBars: this.buildFeeBars(data.fees),
          feeSummary: this.buildFeeSummary(data.fees),
          attendanceSummary: this.combineAttendanceSummaries([
            studentAttendanceSummary,
            teacherAttendanceSummary,
            staffAttendanceSummary,
          ]),
          attendanceSummaries,
          quickSummary: {
            libraryBooks: data.libraryBooks.length,
            libraryMembers: data.libraryMembers.length,
            routes: data.routes.length,
            hostels: data.hostels.length,
            sports: data.sports.length,
            events: data.events.filter((event) => event.status !== 'INACTIVE')
              .length,
            availableBeds: data.hostels.reduce(
              (total, hostel) => total + Number(hostel.availableBeds || 0),
              0,
            ),
            sportParticipants: data.sports.reduce(
              (total, sport) => total + Number(sport.currentParticipants || 0),
              0,
            ),
          },
          recentLeaves: this.buildRecentLeaves(data.leaves),
          upcomingItems: this.buildUpcomingItems(calendarItems),
          calendarItems,
        };
      }),
    );
  }

  private safeGet<T>(url: string): Observable<T[]> {
    return this.http.get<T[]>(url).pipe(catchError(() => of([] as T[])));
  }

  private buildStatCard(
    short: string,
    label: string,
    records: StatusEntity[],
    color: string,
  ): DashboardStatCard {
    const active = records.filter(
      (record) => record.status === 'ACTIVE',
    ).length;
    const inactive = records.length - active;

    return {
      short,
      label,
      value: String(records.length),
      badge: this.getRate(active, records.length),
      active: String(active),
      inactive: String(inactive),
      color,
    };
  }

  private buildFeeSummary(fees: FeeRecord[]): DashboardFeeSummary {
    return fees.reduce<DashboardFeeSummary>(
      (summary, fee) => ({
        totalAmount: summary.totalAmount + Number(fee.amount || 0),
        collectedAmount: summary.collectedAmount + Number(fee.paidAmount || 0),
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
        collectedAmount: 0,
        pendingAmount: 0,
        paidCount: 0,
        pendingCount: 0,
      },
    );
  }

  private buildFeeBars(fees: FeeRecord[]): DashboardFeeBar[] {
    const months = this.getLastMonths(8);

    return months.map((month) => {
      const monthFees = fees.filter((fee) => {
        const dateValue = fee.paidDate || fee.createdAt;

        if (!dateValue) {
          return false;
        }

        const date = new Date(dateValue);

        return (
          date.getFullYear() === month.year && date.getMonth() === month.month
        );
      });

      const totalAmount = monthFees.reduce(
        (total, fee) => total + Number(fee.amount || 0),
        0,
      );

      const collectedAmount = monthFees.reduce(
        (total, fee) => total + Number(fee.paidAmount || 0),
        0,
      );

      return {
        label: month.label,
        collected:
          totalAmount > 0
            ? Math.round((collectedAmount / totalAmount) * 100)
            : 0,
      };
    });
  }

  private buildAttendanceSummary(
    attendanceRecords: AttendanceRecord[],
  ): DashboardAttendanceSummary {
    const today = this.getTodayDate();

    const todayRecords = attendanceRecords.filter(
      (record) => this.toDateKey(record.attendanceDate) === today,
    );

    return {
      present: todayRecords.filter(
        (record) => String(record.status || '').toUpperCase() === 'PRESENT',
      ).length,
      absent: todayRecords.filter(
        (record) => String(record.status || '').toUpperCase() === 'ABSENT',
      ).length,
      late: todayRecords.filter(
        (record) => String(record.status || '').toUpperCase() === 'LATE',
      ).length,
      halfDay: todayRecords.filter(
        (record) => String(record.status || '').toUpperCase() === 'HALF_DAY',
      ).length,
      total: todayRecords.length,
    };
  }

  private combineAttendanceSummaries(
    summaries: DashboardAttendanceSummary[],
  ): DashboardAttendanceSummary {
    return summaries.reduce<DashboardAttendanceSummary>(
      (total, summary) => ({
        present: total.present + summary.present,
        absent: total.absent + summary.absent,
        late: total.late + summary.late,
        halfDay: total.halfDay + summary.halfDay,
        total: total.total + summary.total,
      }),
      {
        present: 0,
        absent: 0,
        late: 0,
        halfDay: 0,
        total: 0,
      },
    );
  }

  private buildRecentLeaves(leaves: LeaveRecord[]): DashboardRecentLeave[] {
    return [...leaves]
      .sort((a, b) => {
        const aTime = new Date(a.createdAt || a.startDate || '').getTime();
        const bTime = new Date(b.createdAt || b.startDate || '').getTime();

        return bTime - aTime;
      })
      .slice(0, 3)
      .map((leave) => ({
        staffName: leave.staffName || 'Unknown Staff',
        designation: leave.designation || 'Staff Member',
        leaveType: leave.leaveType || 'OTHER',
        startDate: leave.startDate || '',
        endDate: leave.endDate || '',
        status: leave.status || 'PENDING',
      }));
  }

  private buildCalendarItems(
    events: SchoolEventRecord[],
    holidays: HolidayRecord[],
    leaves: LeaveRecord[],
  ): DashboardCalendarItem[] {
    const eventItems = events
      .filter((event) => event.status !== 'INACTIVE')
      .flatMap((event) =>
        this.expandCalendarItem({
          id: event.id,
          type: 'EVENT',
          title: event.title,
          subTitle: event.location || event.organizer || 'School event',
          startDate: event.startDate,
          endDate: event.endDate,
          dateKey: this.toDateKey(event.startDate),
          time: this.formatEventTime(event.startTime, event.endTime),
          status: event.status || 'ACTIVE',
          eventType: event.eventType || 'GENERAL',
        }),
      );

    const holidayItems = holidays
      .filter((holiday) => holiday.status !== 'INACTIVE')
      .filter((holiday) => this.getHolidayDate(holiday))
      .flatMap((holiday) => {
        const startDate = this.getHolidayDate(holiday);

        return this.expandCalendarItem({
          id: holiday.id || holiday.holidayCode || `holiday-${startDate}`,
          type: 'HOLIDAY',
          title: holiday.holidayName || holiday.title || 'Holiday',
          subTitle: holiday.holidayType || holiday.description || 'Holiday',
          startDate,
          endDate: holiday.endDate || startDate,
          dateKey: this.toDateKey(startDate),
          status: holiday.status || 'ACTIVE',
          eventType: 'HOLIDAY_EVENT',
        });
      });

    const leaveItems = leaves
      .filter((leave) => leave.startDate)
      .flatMap((leave) =>
        this.expandCalendarItem({
          id: leave.id || `${leave.staffName}-${leave.startDate}`,
          type: 'LEAVE',
          title: `${leave.staffName || 'Staff'} Leave`,
          subTitle: `${this.formatLeaveType(leave.leaveType || 'OTHER')} / ${
            leave.designation || 'Staff Member'
          }`,
          startDate: leave.startDate || '',
          endDate: leave.endDate || leave.startDate || '',
          dateKey: this.toDateKey(leave.startDate || ''),
          status: leave.status || 'PENDING',
          eventType: 'LEAVE',
        }),
      );

    return [...eventItems, ...holidayItems, ...leaveItems].sort((a, b) =>
      a.dateKey.localeCompare(b.dateKey),
    );
  }

  private buildUpcomingItems(
    calendarItems: DashboardCalendarItem[],
  ): DashboardCalendarItem[] {
    const today = this.getTodayDate();
    const uniqueItems = new Map<string, DashboardCalendarItem>();

    calendarItems
      .filter((item) => item.dateKey >= today)
      .forEach((item) => {
        const key = `${item.type}-${item.id}`;

        if (!uniqueItems.has(key)) {
          uniqueItems.set(key, item);
        }
      });

    return Array.from(uniqueItems.values())
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
      .slice(0, 5);
  }

  private expandCalendarItem(
    item: DashboardCalendarItem,
  ): DashboardCalendarItem[] {
    const startKey = this.toDateKey(item.startDate);
    const endKey = this.toDateKey(item.endDate || item.startDate);

    if (!startKey) {
      return [];
    }

    const start = new Date(`${startKey}T00:00:00`);
    const end = new Date(`${endKey || startKey}T00:00:00`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return [{ ...item, dateKey: startKey }];
    }

    const days: DashboardCalendarItem[] = [];
    const cursor = new Date(start);
    let guard = 0;

    while (cursor <= end && guard < 45) {
      const dateKey = cursor.toISOString().slice(0, 10);

      days.push({
        ...item,
        dateKey,
      });

      cursor.setDate(cursor.getDate() + 1);
      guard += 1;
    }

    return days;
  }

  private getHolidayDate(holiday: HolidayRecord): string {
    return (
      holiday.holidayDate ||
      holiday.date ||
      holiday.startDate ||
      holiday.endDate ||
      ''
    );
  }

  private formatEventTime(
    startTime?: string | null,
    endTime?: string | null,
  ): string {
    if (startTime && endTime) {
      return `${startTime} - ${endTime}`;
    }

    if (startTime) {
      return startTime;
    }

    return 'All Day';
  }

  private formatLeaveType(type: string): string {
    return type
      .split('_')
      .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
      .join(' ');
  }

  private toDateKey(value?: string | null): string {
    if (!value) {
      return '';
    }

    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return value.slice(0, 10);
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toISOString().slice(0, 10);
  }

  private getTodayDate(): string {
    const today = new Date();

    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(today.getDate()).padStart(2, '0')}`;
  }

  private getRate(active: number, total: number): string {
    if (total === 0) {
      return '0%';
    }

    return `${Math.round((active / total) * 100)}%`;
  }

  private getLastMonths(count: number) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      month: 'short',
    });

    return Array.from({ length: count }).map((_, index) => {
      const date = new Date();

      date.setMonth(date.getMonth() - (count - 1 - index));

      return {
        month: date.getMonth(),
        year: date.getFullYear(),
        label: formatter.format(date),
      };
    });
  }
}

