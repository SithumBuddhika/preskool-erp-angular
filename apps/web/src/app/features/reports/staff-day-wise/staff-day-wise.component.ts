import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';

import {
  StaffAttendance,
  StaffAttendanceStatus,
} from '../../../core/models/staff-attendance.model';
import { StaffAttendanceService } from '../../../core/services/staff-attendance.service';

type DayColumn = {
  day: number;
  dateKey: string;
  weekday: string;
  isToday: boolean;
};

type StaffDayWiseRow = {
  staffCode: string;
  staffName: string;
  department?: string | null;
  designation?: string | null;
  records: Record<string, StaffAttendance>;
};

@Component({
  selector: 'app-staff-day-wise',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './staff-day-wise.component.html',
  styleUrl: './staff-day-wise.component.scss',
})
export class StaffDayWiseComponent implements OnInit {
  attendanceRecords = signal<StaffAttendance[]>([]);
  isLoading = signal(false);
  serverError = signal('');

  selectedMonth = signal(this.getCurrentMonth());
  searchTerm = signal('');

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

  monthRecords = computed(() => {
    const month = this.selectedMonth();

    return this.attendanceRecords().filter((record) =>
      record.attendanceDate.slice(0, 7).startsWith(month),
    );
  });

  staffRows = computed<StaffDayWiseRow[]>(() => {
    const keyword = this.searchTerm().trim().toLowerCase();
    const rowMap = new Map<string, StaffDayWiseRow>();

    this.monthRecords()
      .filter((record) => {
        if (!keyword) {
          return true;
        }

        return [
          record.staffCode,
          record.staffName,
          record.department || '',
          record.designation || '',
          record.status,
        ]
          .join(' ')
          .toLowerCase()
          .includes(keyword);
      })
      .forEach((record) => {
        const rowKey = record.staffCode || record.staffName;
        const dateKey = record.attendanceDate.slice(0, 10);

        if (!rowMap.has(rowKey)) {
          rowMap.set(rowKey, {
            staffCode: record.staffCode,
            staffName: record.staffName,
            department: record.department,
            designation: record.designation,
            records: {},
          });
        }

        rowMap.get(rowKey)!.records[dateKey] = record;
      });

    return Array.from(rowMap.values()).sort((a, b) =>
      a.staffName.localeCompare(b.staffName),
    );
  });

  presentCount = computed(
    () =>
      this.monthRecords().filter((record) => record.status === 'PRESENT')
        .length,
  );

  absentCount = computed(
    () =>
      this.monthRecords().filter((record) => record.status === 'ABSENT').length,
  );

  lateCount = computed(
    () =>
      this.monthRecords().filter((record) => record.status === 'LATE').length,
  );

  halfDayCount = computed(
    () =>
      this.monthRecords().filter((record) => record.status === 'HALF_DAY')
        .length,
  );

  constructor(
    private readonly staffAttendanceService: StaffAttendanceService,
  ) {}

  ngOnInit(): void {
    this.loadStaffAttendance();
  }

  loadStaffAttendance(): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.staffAttendanceService.getStaffAttendance('', '').subscribe({
      next: (records) => {
        this.attendanceRecords.set(records);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.serverError.set(
          error?.error?.message || 'Failed to load staff attendance report.',
        );
        this.isLoading.set(false);
      },
    });
  }

  onMonthChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.selectedMonth.set(value || this.getCurrentMonth());
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.searchTerm.set(value);
  }

  exportCsv(): void {
    const rows = this.staffRows();
    const days = this.daysInMonth();

    if (rows.length === 0) {
      return;
    }

    const headers = [
      'Staff Code',
      'Staff Name',
      'Department',
      'Designation',
      'Marked Days',
      ...days.map((day) => String(day.day).padStart(2, '0')),
    ];

    const csvRows = rows.map((row) => [
      row.staffCode || 'Not added',
      row.staffName || 'Not added',
      row.department || 'Not added',
      row.designation || 'Not added',
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
    link.download = `staff-day-wise-${this.selectedMonth()}.csv`;
    link.click();

    window.URL.revokeObjectURL(url);
  }

  getRecordForDay(
    row: StaffDayWiseRow,
    day: DayColumn,
  ): StaffAttendance | null {
    return row.records[day.dateKey] || null;
  }

  getStatusShort(status?: StaffAttendanceStatus): string {
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

  getStatusLabel(status?: StaffAttendanceStatus): string {
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

  getStatusClass(status?: StaffAttendanceStatus): string {
    if (!status) {
      return 'status-cell--empty';
    }

    return `status-cell--${status.toLowerCase().replace('_', '-')}`;
  }

  getCellTitle(row: StaffDayWiseRow, day: DayColumn): string {
    const record = this.getRecordForDay(row, day);

    if (!record) {
      return `${row.staffName} / ${day.dateKey} / Not marked`;
    }

    return `${row.staffName} / ${day.dateKey} / ${this.getStatusLabel(
      record.status,
    )}${record.remarks ? ` / ${record.remarks}` : ''}`;
  }

  getMarkedDays(row: StaffDayWiseRow): number {
    return Object.keys(row.records).length;
  }

  getStaffInitial(row: StaffDayWiseRow): string {
    return row.staffName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase();
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
