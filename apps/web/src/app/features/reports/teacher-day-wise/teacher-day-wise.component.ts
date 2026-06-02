import { Component, OnInit, computed, signal } from '@angular/core';
import {
  TeacherAttendance,
  TeacherAttendanceStatus,
} from '../../../core/models/teacher-attendance.model';
import { TeacherAttendanceService } from '../../../core/services/teacher-attendance.service';
import { ReportTabsComponent } from '../components/report-tabs/report-tabs.component';

type DayColumn = {
  dayNumber: number;
  dateKey: string;
  label: string;
};

type DayStatus = TeacherAttendanceStatus | '';

type AttendanceStatusFilter = TeacherAttendanceStatus | 'ALL';

type TeacherDayWiseRow = {
  teacherKey: string;
  employeeNo: string;
  teacherName: string;
  subject: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  attendanceRate: number;
  dayMap: Record<number, DayStatus>;
};

@Component({
  selector: 'app-teacher-day-wise',
  standalone: true,
  imports: [ReportTabsComponent],
  templateUrl: './teacher-day-wise.component.html',
  styleUrl: './teacher-day-wise.component.scss',
})
export class TeacherDayWiseComponent implements OnInit {
  attendanceRecords = signal<TeacherAttendance[]>([]);

  isLoading = signal(false);
  serverError = signal('');

  searchTerm = signal('');
  selectedMonth = signal('');
  selectedSubject = signal('ALL');
  selectedStatus = signal<AttendanceStatusFilter>('ALL');

  monthDays = computed<DayColumn[]>(() => {
    const monthValue = this.selectedMonth();

    if (!monthValue) {
      return [];
    }

    const [year, month] = monthValue.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();

    return Array.from({ length: daysInMonth }, (_, index) => {
      const dayNumber = index + 1;
      const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(
        dayNumber,
      ).padStart(2, '0')}`;

      return {
        dayNumber,
        dateKey,
        label: String(dayNumber).padStart(2, '0'),
      };
    });
  });

  monthRecords = computed(() => {
    const monthValue = this.selectedMonth();

    if (!monthValue) {
      return this.attendanceRecords();
    }

    return this.attendanceRecords().filter((record) =>
      this.formatDateForInput(record.attendanceDate).startsWith(monthValue),
    );
  });

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
        record.teacherEmployeeNo,
        record.teacherName,
        record.subject,
        record.status,
        record.checkInTime,
        record.checkOutTime,
        record.remarks,
      ]
        .filter(Boolean)
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
    const groupedRecords = new Map<string, TeacherAttendance[]>();

    this.filteredMonthRecords().forEach((record) => {
      const teacherKey =
        record.teacherEmployeeNo ||
        `${record.teacherName}-${record.subject || 'NO-SUBJECT'}`;

      if (!groupedRecords.has(teacherKey)) {
        groupedRecords.set(teacherKey, []);
      }

      groupedRecords.get(teacherKey)?.push(record);
    });

    return Array.from(groupedRecords.entries())
      .map(([teacherKey, records]) => {
        const firstRecord = records[0];

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

        const dayMap: Record<number, DayStatus> = {};

        this.monthDays().forEach((day) => {
          const recordForDay = records.find(
            (record) =>
              this.formatDateForInput(record.attendanceDate) === day.dateKey,
          );

          dayMap[day.dayNumber] = recordForDay?.status || '';
        });

        return {
          teacherKey,
          employeeNo: firstRecord.teacherEmployeeNo || 'Not added',
          teacherName: firstRecord.teacherName,
          subject: firstRecord.subject || 'Not added',
          total,
          present,
          absent,
          late,
          halfDay,
          attendanceRate,
          dayMap,
        };
      })
      .sort((a, b) => a.teacherName.localeCompare(b.teacherName));
  });

  totalTeachers = computed(() => this.teacherRows().length);

  totalMarked = computed(() =>
    this.teacherRows().reduce((total, row) => total + row.total, 0),
  );

  presentCount = computed(() =>
    this.teacherRows().reduce((total, row) => total + row.present, 0),
  );

  absentCount = computed(() =>
    this.teacherRows().reduce((total, row) => total + row.absent, 0),
  );

  lateCount = computed(() =>
    this.teacherRows().reduce((total, row) => total + row.late, 0),
  );

  halfDayCount = computed(() =>
    this.teacherRows().reduce((total, row) => total + row.halfDay, 0),
  );

  attendanceRate = computed(() => {
    const total = this.totalMarked();

    if (total === 0) {
      return 0;
    }

    const attended =
      this.presentCount() + this.lateCount() + this.halfDayCount();

    return Math.round((attended / total) * 100);
  });

  selectedMonthLabel = computed(() => {
    const monthValue = this.selectedMonth();

    if (!monthValue) {
      return 'All Months';
    }

    const [year, month] = monthValue.split('-').map(Number);

    return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  });

  constructor(
    private readonly teacherAttendanceService: TeacherAttendanceService,
  ) {}

  ngOnInit(): void {
    this.selectedMonth.set(this.getCurrentMonthForInput());
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

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  onMonthInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.selectedMonth.set(value);
    this.selectedSubject.set('ALL');
    this.selectedStatus.set('ALL');
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
    this.selectedMonth.set(this.getCurrentMonthForInput());
    this.selectedSubject.set('ALL');
    this.selectedStatus.set('ALL');
  }

  exportCsv(): void {
    const rows = this.teacherRows();
    const days = this.monthDays();

    if (rows.length === 0) {
      return;
    }

    const headers = [
      'Employee No',
      'Teacher Name',
      'Subject',
      'Total',
      'Present',
      'Absent',
      'Late',
      'Half Day',
      'Attendance Rate',
      ...days.map((day) => day.label),
    ];

    const csvRows = rows.map((row) => [
      row.employeeNo,
      row.teacherName,
      row.subject,
      String(row.total),
      String(row.present),
      String(row.absent),
      String(row.late),
      String(row.halfDay),
      `${row.attendanceRate}%`,
      ...days.map((day) => this.getStatusShortLabel(row.dayMap[day.dayNumber])),
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
    link.download = `teacher-day-wise-${
      this.selectedMonth() || this.getCurrentMonthForInput()
    }.csv`;
    link.click();

    window.URL.revokeObjectURL(url);
  }

  getStatusShortLabel(status: DayStatus): string {
    const labels: Record<TeacherAttendanceStatus, string> = {
      PRESENT: 'P',
      ABSENT: 'A',
      LATE: 'L',
      HALF_DAY: 'H',
    };

    return status ? labels[status] : '-';
  }

  getStatusTitle(status: DayStatus): string {
    if (!status) {
      return 'Not marked';
    }

    return status
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  getTeacherInitial(row: TeacherDayWiseRow): string {
    return row.teacherName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }

  private formatDateForInput(date: string): string {
    if (!date) {
      return '';
    }

    return new Date(date).toISOString().split('T')[0];
  }

  private getCurrentMonthForInput(): string {
    const today = new Date();

    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      '0',
    )}`;
  }

  private escapeCsvValue(value: string): string {
    const safeValue = String(value).replace(/"/g, '""');

    return `"${safeValue}"`;
  }
}
