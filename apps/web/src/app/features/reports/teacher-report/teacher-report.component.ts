import { Component, OnInit, computed, signal } from '@angular/core';
import {
  Teacher,
  TeacherGender,
  TeacherStatus,
} from '../../../core/models/teacher.model';
import { TeachersService } from '../../../core/services/teachers.service';
import { ReportTabsComponent } from '../components/report-tabs/report-tabs.component';

type TeacherStatusFilter = TeacherStatus | 'ALL';
type TeacherGenderFilter = TeacherGender | 'ALL';

type SubjectSummary = {
  subject: string;
  total: number;
  active: number;
  inactive: number;
};

@Component({
  selector: 'app-teacher-report',
  standalone: true,
  imports: [ReportTabsComponent],
  templateUrl: './teacher-report.component.html',
  styleUrl: './teacher-report.component.scss',
})
export class TeacherReportComponent implements OnInit {
  teachers = signal<Teacher[]>([]);

  isLoading = signal(false);
  serverError = signal('');

  searchTerm = signal('');
  selectedSubject = signal('ALL');
  selectedGender = signal<TeacherGenderFilter>('ALL');
  selectedStatus = signal<TeacherStatusFilter>('ALL');

  filteredTeachers = computed(() => {
    const keyword = this.searchTerm().trim().toLowerCase();
    const subjectFilter = this.selectedSubject();
    const genderFilter = this.selectedGender();
    const statusFilter = this.selectedStatus();

    return this.teachers().filter((teacher) => {
      const searchableText = [
        teacher.employeeNo,
        teacher.fullName,
        teacher.email,
        teacher.phone,
        teacher.gender,
        teacher.subject,
        teacher.qualification,
        teacher.joiningDate,
        teacher.address,
        teacher.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !keyword || searchableText.includes(keyword);
      const matchesSubject =
        subjectFilter === 'ALL' || teacher.subject === subjectFilter;
      const matchesGender =
        genderFilter === 'ALL' || teacher.gender === genderFilter;
      const matchesStatus =
        statusFilter === 'ALL' || teacher.status === statusFilter;

      return matchesSearch && matchesSubject && matchesGender && matchesStatus;
    });
  });

  subjectOptions = computed(() => {
    const subjects = this.teachers()
      .map((teacher) => teacher.subject)
      .filter(Boolean);

    return Array.from(new Set(subjects)).sort((a, b) => a.localeCompare(b));
  });

  totalTeachers = computed(() => this.filteredTeachers().length);

  activeTeachers = computed(
    () =>
      this.filteredTeachers().filter((teacher) => teacher.status === 'ACTIVE')
        .length,
  );

  inactiveTeachers = computed(
    () =>
      this.filteredTeachers().filter((teacher) => teacher.status === 'INACTIVE')
        .length,
  );

  maleTeachers = computed(
    () =>
      this.filteredTeachers().filter((teacher) => teacher.gender === 'MALE')
        .length,
  );

  femaleTeachers = computed(
    () =>
      this.filteredTeachers().filter((teacher) => teacher.gender === 'FEMALE')
        .length,
  );

  otherGenderTeachers = computed(
    () =>
      this.filteredTeachers().filter((teacher) => teacher.gender === 'OTHER')
        .length,
  );

  subjectSummary = computed<SubjectSummary[]>(() => {
    const groupedTeachers = new Map<string, Teacher[]>();

    this.filteredTeachers().forEach((teacher) => {
      const subject = teacher.subject || 'Not added';

      if (!groupedTeachers.has(subject)) {
        groupedTeachers.set(subject, []);
      }

      groupedTeachers.get(subject)?.push(teacher);
    });

    return Array.from(groupedTeachers.entries())
      .map(([subject, teachers]) => ({
        subject,
        total: teachers.length,
        active: teachers.filter((teacher) => teacher.status === 'ACTIVE')
          .length,
        inactive: teachers.filter((teacher) => teacher.status === 'INACTIVE')
          .length,
      }))
      .sort((a, b) => a.subject.localeCompare(b.subject));
  });

  constructor(private readonly teachersService: TeachersService) {}

  ngOnInit(): void {
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
          error?.error?.message || 'Failed to load teacher report.',
        );
        this.isLoading.set(false);
      },
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  onSubjectChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedSubject.set(value);
  }

  onGenderChange(event: Event): void {
    const value = (event.target as HTMLSelectElement)
      .value as TeacherGenderFilter;

    this.selectedGender.set(value);
  }

  onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement)
      .value as TeacherStatusFilter;

    this.selectedStatus.set(value);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedSubject.set('ALL');
    this.selectedGender.set('ALL');
    this.selectedStatus.set('ALL');
  }

  exportCsv(): void {
    const teachers = this.filteredTeachers();

    if (teachers.length === 0) {
      return;
    }

    const headers = [
      'Employee No',
      'Teacher Name',
      'Email',
      'Phone',
      'Gender',
      'Subject',
      'Qualification',
      'Joining Date',
      'Status',
      'Address',
    ];

    const rows = teachers.map((teacher) => [
      teacher.employeeNo,
      teacher.fullName,
      teacher.email,
      teacher.phone,
      this.getGenderLabel(teacher.gender),
      teacher.subject,
      teacher.qualification || '',
      this.formatDisplayDate(teacher.joiningDate),
      this.getStatusLabel(teacher.status),
      teacher.address || '',
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
    link.download = `teacher-report-${this.getTodayForFileName()}.csv`;
    link.click();

    window.URL.revokeObjectURL(url);
  }

  getTeacherInitial(teacher: Teacher): string {
    return teacher.fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }

  getStatusLabel(status: TeacherStatus): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  getGenderLabel(gender: TeacherGender): string {
    return gender.charAt(0) + gender.slice(1).toLowerCase();
  }

  formatDisplayDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  }

  private escapeCsvValue(value: string): string {
    const safeValue = String(value).replace(/"/g, '""');

    return `"${safeValue}"`;
  }

  private getTodayForFileName(): string {
    return new Date().toISOString().split('T')[0];
  }
}
