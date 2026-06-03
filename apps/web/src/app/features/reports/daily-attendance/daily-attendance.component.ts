import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { StaffAttendance } from '../../../core/models/staff-attendance.model';
import { StudentAttendance } from '../../../core/models/student-attendance.model';
import { TeacherAttendance } from '../../../core/models/teacher-attendance.model';
import { StaffAttendanceService } from '../../../core/services/staff-attendance.service';
import { StudentAttendanceService } from '../../../core/services/student-attendance.service';
import { TeacherAttendanceService } from '../../../core/services/teacher-attendance.service';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';
type AttendanceType = 'ALL' | 'STUDENT' | 'TEACHER' | 'STAFF';

type DailyAttendanceRecord = {
  id: string;
  type: Exclude<AttendanceType, 'ALL'>;
  code: string;
  personName: string;
  groupLabel: string;
  subLabel: string;
  attendanceDate: string;
  status: AttendanceStatus;
  checkIn?: string | null;
  checkOut?: string | null;
  remarks?: string | null;
};

type DailySummaryRow = {
  groupLabel: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  rate: number;
};

@Component({
  selector: 'app-daily-attendance',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './daily-attendance.component.html',
  styleUrl: './daily-attendance.component.scss',
})
export class DailyAttendanceComponent implements OnInit {
  allRecords = signal<DailyAttendanceRecord[]>([]);
  isLoading = signal(false);
  serverError = signal('');

  selectedDate = signal(this.getTodayDate());
  searchTerm = signal('');
  selectedType = signal<AttendanceType>('ALL');
  selectedGroup = signal('ALL');
  selectedStatus = signal<AttendanceStatus | 'ALL'>('ALL');

  selectedDateLabel = computed(() =>
    new Date(this.selectedDate()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
    }),
  );

  selectedDateRecords = computed(() =>
    this.allRecords().filter(
      (record) => this.toDateKey(record.attendanceDate) === this.selectedDate(),
    ),
  );

  groupOptions = computed(() => {
    const groups = this.selectedDateRecords()
      .filter(
        (record) =>
          this.selectedType() === 'ALL' || record.type === this.selectedType(),
      )
      .map((record) => record.groupLabel)
      .filter(Boolean);

    return Array.from(new Set(groups)).sort((a, b) => a.localeCompare(b));
  });

  filteredRecords = computed(() => {
    const keyword = this.searchTerm().trim().toLowerCase();
    const type = this.selectedType();
    const group = this.selectedGroup();
    const status = this.selectedStatus();

    return this.selectedDateRecords().filter((record) => {
      const searchableText = [
        record.type,
        record.code,
        record.personName,
        record.groupLabel,
        record.subLabel,
        record.status,
        record.remarks || '',
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch = !keyword || searchableText.includes(keyword);
      const matchesType = type === 'ALL' || record.type === type;
      const matchesGroup = group === 'ALL' || record.groupLabel === group;
      const matchesStatus = status === 'ALL' || record.status === status;

      return matchesSearch && matchesType && matchesGroup && matchesStatus;
    });
  });

  summaryRows = computed<DailySummaryRow[]>(() => {
    const rowMap = new Map<string, DailySummaryRow>();

    this.filteredRecords().forEach((record) => {
      const groupLabel = record.groupLabel || 'Not Grouped';

      if (!rowMap.has(groupLabel)) {
        rowMap.set(groupLabel, {
          groupLabel,
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          halfDay: 0,
          rate: 0,
        });
      }

      const row = rowMap.get(groupLabel)!;

      row.total += 1;

      if (record.status === 'PRESENT') {
        row.present += 1;
      }

      if (record.status === 'ABSENT') {
        row.absent += 1;
      }

      if (record.status === 'LATE') {
        row.late += 1;
      }

      if (record.status === 'HALF_DAY') {
        row.halfDay += 1;
      }

      row.rate =
        row.total > 0 ? Math.round((row.present / row.total) * 100) : 0;
    });

    return Array.from(rowMap.values()).sort((a, b) =>
      a.groupLabel.localeCompare(b.groupLabel),
    );
  });

  totalCount = computed(() => this.filteredRecords().length);

  presentCount = computed(
    () =>
      this.filteredRecords().filter((record) => record.status === 'PRESENT')
        .length,
  );

  absentCount = computed(
    () =>
      this.filteredRecords().filter((record) => record.status === 'ABSENT')
        .length,
  );

  lateCount = computed(
    () =>
      this.filteredRecords().filter((record) => record.status === 'LATE')
        .length,
  );

  halfDayCount = computed(
    () =>
      this.filteredRecords().filter((record) => record.status === 'HALF_DAY')
        .length,
  );

  attendanceRate = computed(() => {
    const total = this.totalCount();

    if (total === 0) {
      return 0;
    }

    return Math.round((this.presentCount() / total) * 100);
  });

  constructor(
    private readonly studentAttendanceService: StudentAttendanceService,
    private readonly teacherAttendanceService: TeacherAttendanceService,
    private readonly staffAttendanceService: StaffAttendanceService,
  ) {}

  ngOnInit(): void {
    this.loadDailyAttendance();
  }

  loadDailyAttendance(): void {
    this.isLoading.set(true);
    this.serverError.set('');

    forkJoin({
      students: this.studentAttendanceService
        .getAttendanceRecords()
        .pipe(catchError(() => of([] as StudentAttendance[]))),
      teachers: this.teacherAttendanceService
        .getAttendanceRecords()
        .pipe(catchError(() => of([] as TeacherAttendance[]))),
      staffs: this.staffAttendanceService
        .getStaffAttendance('', '')
        .pipe(catchError(() => of([] as StaffAttendance[]))),
    }).subscribe({
      next: ({ students, teachers, staffs }) => {
        this.allRecords.set([
          ...students.map((record) => this.mapStudentRecord(record)),
          ...teachers.map((record) => this.mapTeacherRecord(record)),
          ...staffs.map((record) => this.mapStaffRecord(record)),
        ]);

        this.isLoading.set(false);
      },
      error: (error) => {
        this.serverError.set(
          error?.error?.message || 'Failed to load daily attendance.',
        );
        this.isLoading.set(false);
      },
    });
  }

  onDateChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.selectedDate.set(value || this.getTodayDate());
    this.selectedGroup.set('ALL');
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.searchTerm.set(value);
  }

  onTypeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as AttendanceType;

    this.selectedType.set(value);
    this.selectedGroup.set('ALL');
  }

  onGroupChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;

    this.selectedGroup.set(value);
  }

  onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as
      | AttendanceStatus
      | 'ALL';

    this.selectedStatus.set(value);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedDate.set(this.getTodayDate());
    this.selectedType.set('ALL');
    this.selectedGroup.set('ALL');
    this.selectedStatus.set('ALL');
  }

  exportCsv(): void {
    const records = this.filteredRecords();

    if (records.length === 0) {
      return;
    }

    const headers = [
      'Type',
      'Code',
      'Name',
      'Group',
      'Details',
      'Date',
      'Status',
      'Check In',
      'Check Out',
      'Remarks',
    ];

    const csvRows = records.map((record) => [
      this.getTypeLabel(record.type),
      record.code,
      record.personName,
      record.groupLabel,
      record.subLabel,
      this.toDateKey(record.attendanceDate),
      this.getStatusLabel(record.status),
      record.checkIn || '-',
      record.checkOut || '-',
      record.remarks || '-',
    ]);

    const csvContent = [headers, ...csvRows]
      .map((row) => row.map((cell) => this.escapeCsvValue(cell)).join(','))
      .join('\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `daily-attendance-${this.selectedDate()}.csv`;
    link.click();

    window.URL.revokeObjectURL(url);
  }

  getTypeLabel(type: DailyAttendanceRecord['type']): string {
    switch (type) {
      case 'STUDENT':
        return 'Student';
      case 'TEACHER':
        return 'Teacher';
      case 'STAFF':
        return 'Staff';
      default:
        return type;
    }
  }

  getTypeClass(type: DailyAttendanceRecord['type']): string {
    return `type-pill--${type.toLowerCase()}`;
  }

  getStatusLabel(status: AttendanceStatus): string {
    if (status === 'HALF_DAY') {
      return 'Half Day';
    }

    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  getStatusClass(status: AttendanceStatus): string {
    return `status-pill--${status.toLowerCase().replace('_', '-')}`;
  }

  getInitial(record: DailyAttendanceRecord): string {
    return record.personName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase();
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  }

  private mapStudentRecord(record: StudentAttendance): DailyAttendanceRecord {
    const extra = record as unknown as Record<
      string,
      string | null | undefined
    >;

    return {
      id: record.id,
      type: 'STUDENT',
      code: record.studentAdmissionNo || record.attendanceCode || '-',
      personName: record.studentName,
      groupLabel: `${record.className} ${record.section || ''}`.trim(),
      subLabel: record.attendanceCode || 'Student attendance',
      attendanceDate: record.attendanceDate,
      status: record.status as AttendanceStatus,
      checkIn: extra['checkIn'] || extra['checkInTime'] || null,
      checkOut: extra['checkOut'] || extra['checkOutTime'] || null,
      remarks: record.remarks || null,
    };
  }

  private mapTeacherRecord(record: TeacherAttendance): DailyAttendanceRecord {
    const extra = record as unknown as Record<
      string,
      string | null | undefined
    >;

    return {
      id: record.id,
      type: 'TEACHER',
      code: record.teacherEmployeeNo || record.attendanceCode || '-',
      personName: record.teacherName,
      groupLabel: record.subject || 'No Subject',
      subLabel: record.attendanceCode || 'Teacher attendance',
      attendanceDate: record.attendanceDate,
      status: record.status as AttendanceStatus,
      checkIn: extra['checkIn'] || extra['checkInTime'] || null,
      checkOut: extra['checkOut'] || extra['checkOutTime'] || null,
      remarks: record.remarks || null,
    };
  }

  private mapStaffRecord(record: StaffAttendance): DailyAttendanceRecord {
    return {
      id: record.id,
      type: 'STAFF',
      code: record.staffCode,
      personName: record.staffName,
      groupLabel: record.department || 'No Department',
      subLabel: record.designation || 'Staff attendance',
      attendanceDate: record.attendanceDate,
      status: record.status as AttendanceStatus,
      checkIn: null,
      checkOut: null,
      remarks: record.remarks || null,
    };
  }

  private toDateKey(date: string): string {
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

  private escapeCsvValue(value: string): string {
    return `"${String(value).replace(/"/g, '""')}"`;
  }
}
