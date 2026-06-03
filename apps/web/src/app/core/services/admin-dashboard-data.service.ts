import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
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

export type DashboardQuickSummary = {
  libraryBooks: number;
  libraryMembers: number;
  routes: number;
  hostels: number;
  sports: number;
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

export type AdminDashboardData = {
  statCards: DashboardStatCard[];
  feeBars: DashboardFeeBar[];
  feeSummary: DashboardFeeSummary;
  attendanceSummary: DashboardAttendanceSummary;
  quickSummary: DashboardQuickSummary;
  recentLeaves: DashboardRecentLeave[];
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

@Injectable({
  providedIn: 'root',
})
export class AdminDashboardDataService {
  private readonly peopleApiUrl = 'http://localhost:3002/api';
  private readonly academicApiUrl = 'http://localhost:3003/api';

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

      studentAttendance: this.safeGet<AttendanceRecord>(
        `${this.peopleApiUrl}/student-attendance`,
      ),
      teacherAttendance: this.safeGet<AttendanceRecord>(
        `${this.peopleApiUrl}/teacher-attendance`,
      ),
      leaves: this.safeGet<LeaveRecord>(`${this.peopleApiUrl}/leaves`),
    }).pipe(
      map((data) => ({
        statCards: [
          this.buildStatCard('S', 'Total Students', data.students, 'is-orange'),
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
        attendanceSummary: this.buildAttendanceSummary([
          ...data.studentAttendance,
          ...data.teacherAttendance,
        ]),
        quickSummary: {
          libraryBooks: data.libraryBooks.length,
          libraryMembers: data.libraryMembers.length,
          routes: data.routes.length,
          hostels: data.hostels.length,
          sports: data.sports.length,
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
      })),
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
    return fees.reduce(
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
    const today = new Date().toISOString().slice(0, 10);

    const todayRecords = attendanceRecords.filter((record) =>
      record.attendanceDate?.startsWith(today),
    );

    return {
      present: todayRecords.filter((record) => record.status === 'PRESENT')
        .length,
      absent: todayRecords.filter((record) => record.status === 'ABSENT')
        .length,
      late: todayRecords.filter((record) => record.status === 'LATE').length,
      halfDay: todayRecords.filter((record) => record.status === 'HALF_DAY')
        .length,
      total: todayRecords.length,
    };
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
