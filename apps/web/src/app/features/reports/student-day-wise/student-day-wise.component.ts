import { Component, OnInit, computed, signal } from '@angular/core';
import {
  StudentAttendance,
  StudentAttendanceStatus,
} from '../../../core/models/student-attendance.model';
import { StudentAttendanceService } from '../../../core/services/student-attendance.service';
import { ReportTabsComponent } from '../components/report-tabs/report-tabs.component';

type DayColumn = {
  dayNumber: number;
  dateKey: string;
  label: string;
};

type DayStatus = StudentAttendanceStatus | '';

type StudentDayWiseRow = {
  studentKey: string;
  studentName: string;
  admissionNo: string;
  classLabel: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  attendanceRate: number;
  dayMap: Record<number, DayStatus>;
};

@Component({
  selector: 'app-student-day-wise',
  standalone: true,
  imports: [ReportTabsComponent],
  templateUrl: './student-day-wise.component.html',
  styleUrl: './student-day-wise.component.scss',
})
export class StudentDayWiseComponent implements OnInit {
  attendanceRecords = signal<StudentAttendance[]>([]);

  isLoading = signal(false);
  serverError = signal('');

  searchTerm = signal('');
  selectedMonth = signal('');
  selectedClass = signal('ALL');

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
        record.studentAdmissionNo,
        record.studentName,
        record.className,
        record.section,
        record.status,
        record.remarks,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !keyword || searchableText.includes(keyword);
      const matchesClass = classFilter === 'ALL' || classLabel === classFilter;

      return matchesSearch && matchesClass;
    });
  });

  studentRows = computed<StudentDayWiseRow[]>(() => {
    const groupedRecords = new Map<string, StudentAttendance[]>();

    this.filteredMonthRecords().forEach((record) => {
      const studentKey =
        record.studentAdmissionNo ||
        `${record.studentName}-${this.getClassLabel(record)}`;

      if (!groupedRecords.has(studentKey)) {
        groupedRecords.set(studentKey, []);
      }

      groupedRecords.get(studentKey)?.push(record);
    });

    return Array.from(groupedRecords.entries())
      .map(([studentKey, records]) => {
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
          studentKey,
          studentName: firstRecord.studentName,
          admissionNo: firstRecord.studentAdmissionNo || 'Not added',
          classLabel: this.getClassLabel(firstRecord),
          total,
          present,
          absent,
          late,
          halfDay,
          attendanceRate,
          dayMap,
        };
      })
      .sort((a, b) => a.studentName.localeCompare(b.studentName));
  });

  totalStudents = computed(() => this.studentRows().length);

  totalMarked = computed(() =>
    this.studentRows().reduce((total, row) => total + row.total, 0),
  );

  presentCount = computed(() =>
    this.studentRows().reduce((total, row) => total + row.present, 0),
  );

  absentCount = computed(() =>
    this.studentRows().reduce((total, row) => total + row.absent, 0),
  );

  lateCount = computed(() =>
    this.studentRows().reduce((total, row) => total + row.late, 0),
  );

  halfDayCount = computed(() =>
    this.studentRows().reduce((total, row) => total + row.halfDay, 0),
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
    private readonly studentAttendanceService: StudentAttendanceService,
  ) {}

  ngOnInit(): void {
    this.selectedMonth.set(this.getCurrentMonthForInput());
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

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  onMonthInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.selectedMonth.set(value);
    this.selectedClass.set('ALL');
  }

  onClassChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedClass.set(value);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedMonth.set(this.getCurrentMonthForInput());
    this.selectedClass.set('ALL');
  }

  exportCsv(): void {
    const rows = this.studentRows();
    const days = this.monthDays();

    if (rows.length === 0) {
      return;
    }

    const headers = [
      'Admission No',
      'Student Name',
      'Class',
      'Total',
      'Present',
      'Absent',
      'Late',
      'Half Day',
      'Attendance Rate',
      ...days.map((day) => day.label),
    ];

    const csvRows = rows.map((row) => [
      row.admissionNo,
      row.studentName,
      row.classLabel,
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
    link.download = `student-day-wise-${
      this.selectedMonth() || this.getCurrentMonthForInput()
    }.csv`;
    link.click();

    window.URL.revokeObjectURL(url);
  }

  getClassLabel(record: StudentAttendance): string {
    return `${record.className} ${record.section || ''}`.trim();
  }

  getStatusShortLabel(status: DayStatus): string {
    const labels: Record<StudentAttendanceStatus, string> = {
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

  getStudentInitial(row: StudentDayWiseRow): string {
    return row.studentName
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
