import { Component, OnInit, computed, signal } from '@angular/core';
import { Teacher } from '../../../core/models/teacher.model';
import { TeachersService } from '../../../core/services/teachers.service';
import { ReportTabsComponent } from '../components/report-tabs/report-tabs.component';

type DayColumn = {
  dayNumber: number;
  label: string;
};

type TeacherDayWiseRow = {
  teacherKey: string;
  employeeNo: string;
  teacherName: string;
  subject: string;
  status: string;
  totalDays: number;
  activeDays: number;
  inactiveDays: number;
  dayMap: Record<number, string>;
};

@Component({
  selector: 'app-teacher-day-wise',
  standalone: true,
  imports: [ReportTabsComponent],
  templateUrl: './teacher-day-wise.component.html',
  styleUrl: './teacher-day-wise.component.scss',
})
export class TeacherDayWiseComponent implements OnInit {
  teachers = signal<Teacher[]>([]);

  isLoading = signal(false);
  serverError = signal('');

  searchTerm = signal('');
  selectedMonth = signal('');
  selectedSubject = signal('ALL');
  selectedStatus = signal('ALL');

  monthDays = computed<DayColumn[]>(() => {
    const monthValue = this.selectedMonth();

    if (!monthValue) {
      return [];
    }

    const [year, month] = monthValue.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();

    return Array.from({ length: daysInMonth }, (_, index) => ({
      dayNumber: index + 1,
      label: String(index + 1).padStart(2, '0'),
    }));
  });

  subjectOptions = computed(() => {
    const subjects = this.teachers()
      .map((teacher) => teacher.subject)
      .filter(Boolean);

    return Array.from(new Set(subjects)).sort((a, b) => a.localeCompare(b));
  });

  filteredTeachers = computed(() => {
    const keyword = this.searchTerm().trim().toLowerCase();
    const subjectFilter = this.selectedSubject();
    const statusFilter = this.selectedStatus();

    return this.teachers().filter((teacher) => {
      const searchableText = [
        teacher.employeeNo,
        teacher.fullName,
        teacher.email,
        teacher.phone,
        teacher.subject,
        teacher.qualification,
        teacher.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !keyword || searchableText.includes(keyword);
      const matchesSubject =
        subjectFilter === 'ALL' || teacher.subject === subjectFilter;
      const matchesStatus =
        statusFilter === 'ALL' || teacher.status === statusFilter;

      return matchesSearch && matchesSubject && matchesStatus;
    });
  });

  teacherRows = computed<TeacherDayWiseRow[]>(() =>
    this.filteredTeachers()
      .map((teacher) => {
        const dayMap: Record<number, string> = {};

        this.monthDays().forEach((day) => {
          dayMap[day.dayNumber] = teacher.status === 'ACTIVE' ? 'A' : 'I';
        });

        const totalDays = this.monthDays().length;
        const activeDays = teacher.status === 'ACTIVE' ? totalDays : 0;
        const inactiveDays = teacher.status === 'INACTIVE' ? totalDays : 0;

        return {
          teacherKey: teacher.id,
          employeeNo: teacher.employeeNo,
          teacherName: teacher.fullName,
          subject: teacher.subject,
          status: teacher.status,
          totalDays,
          activeDays,
          inactiveDays,
          dayMap,
        };
      })
      .sort((a, b) => a.teacherName.localeCompare(b.teacherName)),
  );

  totalTeachers = computed(() => this.teacherRows().length);

  activeTeachers = computed(
    () => this.teacherRows().filter((row) => row.status === 'ACTIVE').length,
  );

  inactiveTeachers = computed(
    () => this.teacherRows().filter((row) => row.status === 'INACTIVE').length,
  );

  totalActiveDays = computed(() =>
    this.teacherRows().reduce((total, row) => total + row.activeDays, 0),
  );

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

  constructor(private readonly teachersService: TeachersService) {}

  ngOnInit(): void {
    this.selectedMonth.set(this.getCurrentMonthForInput());
    this.loadTeachers();
  }

  loadTeachers(): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.teachersService.getTeachers().subscribe({
      next: (teachers) => {
        this.teachers.set(teachers);
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
  }

  onSubjectChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedSubject.set(value);
  }

  onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
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
      'Status',
      'Total Days',
      'Active Days',
      'Inactive Days',
      ...days.map((day) => day.label),
    ];

    const csvRows = rows.map((row) => [
      row.employeeNo,
      row.teacherName,
      row.subject,
      this.getStatusLabel(row.status),
      String(row.totalDays),
      String(row.activeDays),
      String(row.inactiveDays),
      ...days.map((day) => row.dayMap[day.dayNumber] || '-'),
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
    link.download = `teacher-day-wise-${this.selectedMonth() || this.getCurrentMonthForInput()}.csv`;
    link.click();

    window.URL.revokeObjectURL(url);
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

  getStatusLabel(status: string): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  private getCurrentMonthForInput(): string {
    const today = new Date();

    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  }

  private escapeCsvValue(value: string): string {
    const safeValue = String(value).replace(/"/g, '""');

    return `"${safeValue}"`;
  }
}
