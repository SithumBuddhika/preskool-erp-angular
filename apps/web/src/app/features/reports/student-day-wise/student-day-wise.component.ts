import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';

import {
  StudentAttendance,
  StudentAttendanceStatus,
} from '../../../core/models/student-attendance.model';
import { StudentAttendanceService } from '../../../core/services/student-attendance.service';

type DayColumn = {
  day: number;
  dateKey: string;
  weekday: string;
  isToday: boolean;
};

type DayStatus = StudentAttendanceStatus | '';

type StudentDayWiseRow = {
  studentKey: string;
  studentName: string;
  admissionNo: string;
  classLabel: string;
  records: Record<string, StudentAttendance>;
};

@Component({
  selector: 'app-student-day-wise',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-day-wise.component.html',
  styleUrl: './student-day-wise.component.scss',
})
export class StudentDayWiseComponent implements OnInit {
  attendanceRecords = signal<StudentAttendance[]>([]);
  isLoading = signal(false);
  serverError = signal('');

  selectedMonth = signal(this.getCurrentMonth());
  searchTerm = signal('');
  selectedClass = signal('ALL');

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

  classOptions = computed(() => {
    const classes = this.monthRecords()
      .map((record) => this.getClassLabel(record))
      .filter(Boolean);

    return Array.from(new Set(classes)).sort((a, b) => a.localeCompare(b));
  });

  filteredMonthRecords = computed(() => {
    const keyword = this.searchTerm().trim().toLowerCase();
    const classFilter = this.selectedClass();

    return this.monthRecords().filter((record) => {
      const classLabel = this.getClassLabel(record);

      const searchableText = [
        record.attendanceCode,
        record.studentAdmissionNo || '',
        record.studentName,
        record.className,
        record.section || '',
        record.status,
        record.remarks || '',
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch = !keyword || searchableText.includes(keyword);
      const matchesClass = classFilter === 'ALL' || classLabel === classFilter;

      return matchesSearch && matchesClass;
    });
  });

  studentRows = computed<StudentDayWiseRow[]>(() => {
    const rowMap = new Map<string, StudentDayWiseRow>();

    this.filteredMonthRecords().forEach((record) => {
      const studentKey =
        record.studentAdmissionNo ||
        `${record.studentName}-${this.getClassLabel(record)}`;
      const dateKey = this.toDateKey(record.attendanceDate);

      if (!rowMap.has(studentKey)) {
        rowMap.set(studentKey, {
          studentKey,
          studentName: record.studentName,
          admissionNo: record.studentAdmissionNo || 'Not added',
          classLabel: this.getClassLabel(record),
          records: {},
        });
      }

      rowMap.get(studentKey)!.records[dateKey] = record;
    });

    return Array.from(rowMap.values()).sort((a, b) =>
      a.studentName.localeCompare(b.studentName),
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
    private readonly studentAttendanceService: StudentAttendanceService,
  ) {}

  ngOnInit(): void {
    this.loadAttendanceRecords();
  }

  loadAttendanceRecords(): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.studentAttendanceService.getAttendanceRecords().subscribe({
      next: (records) => {
        this.attendanceRecords.set(records);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.serverError.set(
          error?.error?.message || 'Failed to load student day wise report.',
        );
        this.isLoading.set(false);
      },
    });
  }

  onMonthChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.selectedMonth.set(value || this.getCurrentMonth());
    this.selectedClass.set('ALL');
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.searchTerm.set(value);
  }

  onClassChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;

    this.selectedClass.set(value);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedMonth.set(this.getCurrentMonth());
    this.selectedClass.set('ALL');
  }

  exportCsv(): void {
    const rows = this.studentRows();
    const days = this.daysInMonth();

    if (rows.length === 0) {
      return;
    }

    const headers = [
      'Admission No',
      'Student Name',
      'Class',
      'Marked Days',
      ...days.map((day) => String(day.day).padStart(2, '0')),
    ];

    const csvRows = rows.map((row) => [
      row.admissionNo,
      row.studentName,
      row.classLabel,
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
    link.download = `student-day-wise-${this.selectedMonth()}.csv`;
    link.click();

    window.URL.revokeObjectURL(url);
  }

  getRecordForDay(
    row: StudentDayWiseRow,
    day: DayColumn,
  ): StudentAttendance | null {
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

  getCellTitle(row: StudentDayWiseRow, day: DayColumn): string {
    const record = this.getRecordForDay(row, day);

    if (!record) {
      return `${row.studentName} / ${day.dateKey} / Not marked`;
    }

    return `${row.studentName} / ${day.dateKey} / ${this.getStatusLabel(
      record.status,
    )}${record.remarks ? ` / ${record.remarks}` : ''}`;
  }

  getMarkedDays(row: StudentDayWiseRow): number {
    return Object.keys(row.records).length;
  }

  getStudentInitial(row: StudentDayWiseRow): string {
    return row.studentName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase();
  }

  getClassLabel(record: StudentAttendance): string {
    return `${record.className} ${record.section || ''}`.trim();
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
