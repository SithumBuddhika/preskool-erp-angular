import { Component, OnInit, computed, signal } from '@angular/core';
import {
  StudentAttendance,
  StudentAttendanceStatus,
} from '../../../core/models/student-attendance.model';
import { StudentAttendanceService } from '../../../core/services/student-attendance.service';
import { ReportTabsComponent } from '../components/report-tabs/report-tabs.component';

type AttendanceStatusFilter = StudentAttendanceStatus | 'ALL';

type DailyClassSummary = {
  classLabel: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  attendanceRate: number;
};

@Component({
  selector: 'app-daily-attendance',
  standalone: true,
  imports: [ReportTabsComponent],
  templateUrl: './daily-attendance.component.html',
  styleUrl: './daily-attendance.component.scss',
})
export class DailyAttendanceComponent implements OnInit {
  attendanceRecords = signal<StudentAttendance[]>([]);

  isLoading = signal(false);
  serverError = signal('');

  searchTerm = signal('');
  selectedDate = signal('');
  selectedClass = signal('ALL');
  selectedStatus = signal<AttendanceStatusFilter>('ALL');

  dailyRecords = computed(() => {
    const selectedDate = this.selectedDate();

    if (!selectedDate) {
      return this.attendanceRecords();
    }

    return this.attendanceRecords().filter(
      (record) =>
        this.formatDateForInput(record.attendanceDate) === selectedDate,
    );
  });

  filteredRecords = computed(() => {
    const keyword = this.searchTerm().trim().toLowerCase();
    const classFilter = this.selectedClass();
    const statusFilter = this.selectedStatus();

    return this.dailyRecords().filter((record) => {
      const classLabel = this.getClassLabel(record);

      const searchableText = [
        record.attendanceCode,
        record.studentAdmissionNo,
        record.studentName,
        record.className,
        record.section,
        record.status,
        record.checkInTime,
        record.checkOutTime,
        record.remarks,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !keyword || searchableText.includes(keyword);
      const matchesClass = classFilter === 'ALL' || classLabel === classFilter;
      const matchesStatus =
        statusFilter === 'ALL' || record.status === statusFilter;

      return matchesSearch && matchesClass && matchesStatus;
    });
  });

  classOptions = computed(() => {
    const classes = this.dailyRecords()
      .map((record) => this.getClassLabel(record))
      .filter(Boolean);

    return Array.from(new Set(classes)).sort((a, b) => a.localeCompare(b));
  });

  totalRecords = computed(() => this.filteredRecords().length);

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
    const total = this.totalRecords();

    if (total === 0) {
      return 0;
    }

    const attended =
      this.presentCount() + this.lateCount() + this.halfDayCount();

    return Math.round((attended / total) * 100);
  });

  classWiseDailySummary = computed<DailyClassSummary[]>(() => {
    const groupedRecords = new Map<string, StudentAttendance[]>();

    this.filteredRecords().forEach((record) => {
      const classLabel = this.getClassLabel(record);

      if (!groupedRecords.has(classLabel)) {
        groupedRecords.set(classLabel, []);
      }

      groupedRecords.get(classLabel)?.push(record);
    });

    return Array.from(groupedRecords.entries())
      .map(([classLabel, records]) => {
        const present = records.filter(
          (record) => record.status === 'PRESENT',
        ).length;
        const absent = records.filter(
          (record) => record.status === 'ABSENT',
        ).length;
        const late = records.filter(
          (record) => record.status === 'LATE',
        ).length;
        const halfDay = records.filter(
          (record) => record.status === 'HALF_DAY',
        ).length;

        const total = records.length;
        const attended = present + late + halfDay;
        const attendanceRate =
          total === 0 ? 0 : Math.round((attended / total) * 100);

        return {
          classLabel,
          total,
          present,
          absent,
          late,
          halfDay,
          attendanceRate,
        };
      })
      .sort((a, b) => a.classLabel.localeCompare(b.classLabel));
  });

  selectedDateLabel = computed(() => {
    const date = this.selectedDate();

    if (!date) {
      return 'All Dates';
    }

    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
    });
  });

  constructor(
    private readonly studentAttendanceService: StudentAttendanceService,
  ) {}

  ngOnInit(): void {
    this.selectedDate.set(this.getTodayForInput());
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
          error?.error?.message || 'Failed to load daily attendance report.',
        );
        this.isLoading.set(false);
      },
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  onDateInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.selectedDate.set(value);
    this.selectedClass.set('ALL');
  }

  onClassChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedClass.set(value);
  }

  onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement)
      .value as AttendanceStatusFilter;

    this.selectedStatus.set(value);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedDate.set(this.getTodayForInput());
    this.selectedClass.set('ALL');
    this.selectedStatus.set('ALL');
  }

  exportCsv(): void {
    const records = this.filteredRecords();

    if (records.length === 0) {
      return;
    }

    const headers = [
      'Attendance ID',
      'Admission No',
      'Student Name',
      'Class',
      'Date',
      'Status',
      'Check In',
      'Check Out',
      'Remarks',
    ];

    const rows = records.map((record) => [
      record.attendanceCode,
      record.studentAdmissionNo || '',
      record.studentName,
      this.getClassLabel(record),
      this.formatDisplayDate(record.attendanceDate),
      this.getStatusLabel(record.status),
      record.checkInTime || '',
      record.checkOutTime || '',
      record.remarks || '',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => this.escapeCsvValue(cell)).join(','))
      .join('\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `daily-attendance-${this.selectedDate() || this.getTodayForInput()}.csv`;
    link.click();

    window.URL.revokeObjectURL(url);
  }

  getClassLabel(record: StudentAttendance): string {
    return `${record.className} ${record.section || ''}`.trim();
  }

  getStatusLabel(status: StudentAttendanceStatus): string {
    return status
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  getAttendanceInitial(record: StudentAttendance): string {
    return record.studentName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }

  formatDisplayDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  }

  formatTime(time?: string | null): string {
    return time || 'Not added';
  }

  private formatDateForInput(date: string): string {
    if (!date) {
      return '';
    }

    return new Date(date).toISOString().split('T')[0];
  }

  private getTodayForInput(): string {
    return new Date().toISOString().split('T')[0];
  }

  private escapeCsvValue(value: string): string {
    const safeValue = String(value).replace(/"/g, '""');

    return `"${safeValue}"`;
  }
}
