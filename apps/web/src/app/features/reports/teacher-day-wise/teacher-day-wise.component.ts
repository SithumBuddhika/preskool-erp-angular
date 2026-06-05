import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';

import {
  TeacherAttendance,
  TeacherAttendanceStatus,
} from '../../../core/models/teacher-attendance.model';
import { TeacherAttendanceService } from '../../../core/services/teacher-attendance.service';
import { ReportTabsComponent } from '../components/report-tabs/report-tabs.component';

type DayColumn = {
  day: number;
  dateKey: string;
  weekday: string;
  isToday: boolean;
};

type DayStatus = TeacherAttendanceStatus | '';
type AttendanceStatusFilter = TeacherAttendanceStatus | 'ALL';

type TeacherDayWiseRow = {
  teacherKey: string;
  employeeNo: string;
  teacherName: string;
  subject: string;
  records: Record<string, TeacherAttendance>;
};

@Component({
  selector: 'app-teacher-day-wise',
  standalone: true,
  imports: [CommonModule, ReportTabsComponent],
  templateUrl: './teacher-day-wise.component.html',
  styleUrl: './teacher-day-wise.component.scss',
})
export class TeacherDayWiseComponent implements OnInit {
  attendanceRecords = signal<TeacherAttendance[]>([]);
  isLoading = signal(false);
  serverError = signal('');

  selectedMonth = signal(this.getCurrentMonth());
  searchTerm = signal('');
  selectedSubject = signal('ALL');
  selectedStatus = signal<AttendanceStatusFilter>('ALL');

  monthLabel = computed(() => {
    const [year, month] = this.selectedMonth().split('-').map(Number);

    return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  });

  daysInMonth = computed<DayColumn[]>(() => {
    const [year, month] = this.selectedMonth().split('-').map(Number);
    const totalDays = new Date(year, month, 0).getDate();
    const todayKey = this.getTodayDateKey();

    return Array.from({ length: totalDays }).map((_, index) => {
      const day = index + 1;
      const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(
        day,
      ).padStart(2, '0')}`;

      const date = new Date(year, month - 1, day);

      return {
        day,
        dateKey,
        weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday: dateKey === todayKey,
      };
    });
  });

  monthRecords = computed(() =>
    this.attendanceRecords().filter((record) =>
      this.toDateKey(record.attendanceDate).startsWith(this.selectedMonth()),
    ),
  );

  subjectOptions = computed(() => {
    const subjects = this.monthRecords()
      .map((record) => record.subject || '')
      .filter(Boolean);

    return Array.from(new Set(subjects)).sort((a, b) => a.localeCompare(b));
  });

  filteredMonthRecords = computed(() => {
    const keyword = this.searchTerm().trim().toLowerCase();
    const subjectFilter = this.selectedSubject();
    const statusFilter = this.selectedStatus();

    return this.monthRecords().filter((record) => {
      const searchableText = [
        record.attendanceCode,
        record.teacherEmployeeNo || '',
        record.teacherName,
        record.subject || '',
        record.status,
        record.remarks || '',
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch = !keyword || searchableText.includes(keyword);
      const matchesSubject =
        subjectFilter === 'ALL' || record.subject === subjectFilter;
      const matchesStatus =
        statusFilter === 'ALL' || record.status === statusFilter;

      return matchesSearch && matchesSubject && matchesStatus;
    });
  });

  teacherRows = computed<TeacherDayWiseRow[]>(() => {
    const rowMap = new Map<string, TeacherDayWiseRow>();

    this.filteredMonthRecords().forEach((record) => {
      const teacherKey =
        record.teacherEmployeeNo ||
        `${record.teacherName}-${record.subject || 'NO-SUBJECT'}`;
      const dateKey = this.toDateKey(record.attendanceDate);

      if (!rowMap.has(teacherKey)) {
        rowMap.set(teacherKey, {
          teacherKey,
          employeeNo: record.teacherEmployeeNo || 'Not added',
          teacherName: record.teacherName,
          subject: record.subject || 'Not added',
          records: {},
        });
      }

      rowMap.get(teacherKey)!.records[dateKey] = record;
    });

    return Array.from(rowMap.values()).sort((a, b) =>
      a.teacherName.localeCompare(b.teacherName),
    );
  });

  totalMarked = computed(() => this.filteredMonthRecords().length);

  presentCount = computed(
    () =>
      this.filteredMonthRecords().filter(
        (record) => record.status === 'PRESENT',
      ).length,
  );

  absentCount = computed(
    () =>
      this.filteredMonthRecords().filter((record) => record.status === 'ABSENT')
        .length,
  );

  lateCount = computed(
    () =>
      this.filteredMonthRecords().filter((record) => record.status === 'LATE')
        .length,
  );

  halfDayCount = computed(
    () =>
      this.filteredMonthRecords().filter(
        (record) => record.status === 'HALF_DAY',
      ).length,
  );

  constructor(
    private readonly teacherAttendanceService: TeacherAttendanceService,
  ) {}

  ngOnInit(): void {
    this.loadAttendanceRecords();
  }

  loadAttendanceRecords(): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.teacherAttendanceService.getAttendanceRecords().subscribe({
      next: (records) => {
        this.attendanceRecords.set(records);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.serverError.set(
          error?.error?.message || 'Failed to load teacher day wise report.',
        );
        this.isLoading.set(false);
      },
    });
  }

  onMonthChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.selectedMonth.set(value || this.getCurrentMonth());
    this.selectedSubject.set('ALL');
    this.selectedStatus.set('ALL');
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.searchTerm.set(value);
  }

  onSubjectChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;

    this.selectedSubject.set(value);
  }

  onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement)
      .value as AttendanceStatusFilter;

    this.selectedStatus.set(value);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedMonth.set(this.getCurrentMonth());
    this.selectedSubject.set('ALL');
    this.selectedStatus.set('ALL');
  }

  exportCsv(): void {
    const rows = this.teacherRows();
    const days = this.daysInMonth();

    if (rows.length === 0) {
      return;
    }

    const headers = [
      'Employee No',
      'Teacher Name',
      'Subject',
      'Marked Days',
      ...days.map((day) => String(day.day).padStart(2, '0')),
    ];

    const csvRows = rows.map((row) => [
      row.employeeNo,
      row.teacherName,
      row.subject,
      String(this.getMarkedDays(row)),
      ...days.map((day) =>
        this.getStatusShort(this.getRecordForDay(row, day)?.status),
      ),
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
    link.download = `teacher-day-wise-${this.selectedMonth()}.csv`;
    link.click();

    window.URL.revokeObjectURL(url);
  }

  getRecordForDay(
    row: TeacherDayWiseRow,
    day: DayColumn,
  ): TeacherAttendance | null {
    return row.records[day.dateKey] || null;
  }

  getStatusShort(status?: DayStatus): string {
    switch (status) {
      case 'PRESENT':
        return 'P';
      case 'ABSENT':
        return 'A';
      case 'LATE':
        return 'L';
      case 'HALF_DAY':
        return 'H';
      default:
        return '-';
    }
  }

  getStatusLabel(status?: DayStatus): string {
    switch (status) {
      case 'PRESENT':
        return 'Present';
      case 'ABSENT':
        return 'Absent';
      case 'LATE':
        return 'Late';
      case 'HALF_DAY':
        return 'Half Day';
      default:
        return 'Not Marked';
    }
  }

  getStatusClass(status?: DayStatus): string {
    if (!status) {
      return 'status-cell--empty';
    }

    return `status-cell--${status.toLowerCase().replace('_', '-')}`;
  }

  getCellTitle(row: TeacherDayWiseRow, day: DayColumn): string {
    const record = this.getRecordForDay(row, day);

    if (!record) {
      return `${row.teacherName} / ${day.dateKey} / Not marked`;
    }

    return `${row.teacherName} / ${day.dateKey} / ${this.getStatusLabel(
      record.status,
    )}${record.remarks ? ` / ${record.remarks}` : ''}`;
  }

  getMarkedDays(row: TeacherDayWiseRow): number {
    return Object.keys(row.records).length;
  }

  getTeacherInitial(row: TeacherDayWiseRow): string {
    return row.teacherName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase();
  }

  private toDateKey(date: string): string {
    return new Date(date).toISOString().slice(0, 10);
  }

  private getCurrentMonth(): string {
    const today = new Date();

    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      '0',
    )}`;
  }

  private getTodayDateKey(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private escapeCsvValue(value: string): string {
    return `"${String(value).replace(/"/g, '""')}"`;
  }
}
