import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  StudentAttendance,
  StudentAttendanceStatus,
} from '../../../core/models/student-attendance.model';
import { StudentAttendanceService } from '../../../core/services/student-attendance.service';

type AttendanceStatusFilter = StudentAttendanceStatus | 'ALL';

type AttendanceTypeSummary = {
  status: StudentAttendanceStatus;
  label: string;
  count: number;
  percentage: number;
};

type ClassWiseTypeSummary = {
  classLabel: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  attendanceRate: number;
};

@Component({
  selector: 'app-student-attendance-type-report',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './student-attendance-type.component.html',
  styleUrl: './student-attendance-type.component.scss',
})
export class StudentAttendanceTypeComponent implements OnInit {
  attendanceRecords = signal<StudentAttendance[]>([]);

  isLoading = signal(false);
  serverError = signal('');

  searchTerm = signal('');
  selectedDate = signal('');
  selectedClass = signal('ALL');
  selectedStatus = signal<AttendanceStatusFilter>('ALL');

  filteredRecords = computed(() => {
    const keyword = this.searchTerm().trim().toLowerCase();
    const date = this.selectedDate();
    const classFilter = this.selectedClass();
    const statusFilter = this.selectedStatus();

    return this.attendanceRecords().filter((record) => {
      const recordDate = this.formatDateForInput(record.attendanceDate);
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
      const matchesDate = !date || recordDate === date;
      const matchesClass = classFilter === 'ALL' || classLabel === classFilter;
      const matchesStatus =
        statusFilter === 'ALL' || record.status === statusFilter;

      return matchesSearch && matchesDate && matchesClass && matchesStatus;
    });
  });

  classOptions = computed(() => {
    const classes = this.attendanceRecords()
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

  typeSummary = computed<AttendanceTypeSummary[]>(() => {
    const total = this.totalRecords();

    const rows: Array<{ status: StudentAttendanceStatus; count: number }> = [
      {
        status: 'PRESENT',
        count: this.presentCount(),
      },
      {
        status: 'ABSENT',
        count: this.absentCount(),
      },
      {
        status: 'LATE',
        count: this.lateCount(),
      },
      {
        status: 'HALF_DAY',
        count: this.halfDayCount(),
      },
    ];

    return rows.map((row) => ({
      status: row.status,
      label: this.getStatusLabel(row.status),
      count: row.count,
      percentage: total === 0 ? 0 : Math.round((row.count / total) * 100),
    }));
  });

  classWiseSummary = computed<ClassWiseTypeSummary[]>(() => {
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
          error?.error?.message ||
            'Failed to load student attendance type report.',
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
    this.selectedDate.set('');
    this.selectedClass.set('ALL');
    this.selectedStatus.set('ALL');
  }

  exportCsv(): void {
    const rows = this.classWiseSummary();

    if (rows.length === 0) {
      return;
    }

    const headers = [
      'Class',
      'Total Records',
      'Present',
      'Absent',
      'Late',
      'Half Day',
      'Attendance Rate',
    ];

    const csvRows = rows.map((row) => [
      row.classLabel,
      String(row.total),
      String(row.present),
      String(row.absent),
      String(row.late),
      String(row.halfDay),
      `${row.attendanceRate}%`,
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
    link.download = `student-attendance-type-${this.getTodayForFileName()}.csv`;
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

  getStatusShortLabel(status: StudentAttendanceStatus): string {
    const labels: Record<StudentAttendanceStatus, string> = {
      PRESENT: 'P',
      ABSENT: 'A',
      LATE: 'L',
      HALF_DAY: 'H',
    };

    return labels[status];
  }

  formatDisplayDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  }

  private formatDateForInput(date: string): string {
    if (!date) {
      return '';
    }

    return new Date(date).toISOString().split('T')[0];
  }

  private escapeCsvValue(value: string): string {
    const safeValue = String(value).replace(/"/g, '""');

    return `"${safeValue}"`;
  }

  private getTodayForFileName(): string {
    return new Date().toISOString().split('T')[0];
  }
}
