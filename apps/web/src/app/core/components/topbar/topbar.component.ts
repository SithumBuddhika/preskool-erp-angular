import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TablerIconComponent, provideTablerIcons } from 'angular-tabler-icons';
import {
  IconBell,
  IconChevronDown,
  IconLogout,
  IconSearch,
} from 'angular-tabler-icons/icons';
import { AuthService } from '../../services/auth.service';

type QuickSearchItem = {
  label: string;
  route: string;
  keywords: string[];
};

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [FormsModule, TablerIconComponent],
  providers: [
    provideTablerIcons({
      IconSearch,
      IconBell,
      IconChevronDown,
      IconLogout,
    }),
  ],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
})
export class TopbarComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  currentUser = this.authService.currentUser;

  searchTerm = '';
  isSearchOpen = false;

  private readonly quickSearchItems: QuickSearchItem[] = [
    {
      label: 'Admin Dashboard',
      route: '/dashboard/admin',
      keywords: ['admin', 'dashboard', 'home', 'overview'],
    },
    {
      label: 'Student Dashboard',
      route: '/dashboard/student',
      keywords: ['student dashboard', 'student overview'],
    },
    {
      label: 'Teacher Dashboard',
      route: '/dashboard/teacher',
      keywords: ['teacher dashboard', 'teacher overview'],
    },
    {
      label: 'Parent Dashboard',
      route: '/dashboard/parent',
      keywords: ['parent dashboard', 'parent overview'],
    },
    {
      label: 'Students',
      route: '/people/students',
      keywords: ['student', 'students', 'admission', 'people'],
    },
    {
      label: 'Parents',
      route: '/people/parents',
      keywords: ['parent', 'parents', 'people'],
    },
    {
      label: 'Guardians',
      route: '/people/guardians',
      keywords: ['guardian', 'guardians', 'people'],
    },
    {
      label: 'Teachers',
      route: '/people/teachers',
      keywords: ['teacher', 'teachers', 'people'],
    },
    {
      label: 'Classes',
      route: '/academic/classes',
      keywords: ['class', 'classes', 'academic'],
    },
    {
      label: 'Class Rooms',
      route: '/academic/class-rooms',
      keywords: ['class room', 'classroom', 'room'],
    },
    {
      label: 'Subjects',
      route: '/academic/subjects',
      keywords: ['subject', 'subjects'],
    },
    {
      label: 'Class Routine',
      route: '/academic/class-routine',
      keywords: ['routine', 'class routine', 'schedule'],
    },
    {
      label: 'Exam Schedule',
      route: '/academic/exam-schedule',
      keywords: ['exam', 'exams', 'exam schedule'],
    },
    {
      label: 'Grades',
      route: '/academic/grades',
      keywords: ['grade', 'grades'],
    },
    {
      label: 'Subject Groups',
      route: '/academic/syllabus-subject-groups',
      keywords: ['subject group', 'syllabus', 'group'],
    },
    {
      label: 'Time Table',
      route: '/academic/time-table',
      keywords: ['time table', 'timetable'],
    },
    {
      label: 'Fee Groups',
      route: '/management/fee-groups',
      keywords: ['fee group', 'fee groups'],
    },
    {
      label: 'Fees Collection',
      route: '/management/fees',
      keywords: ['fee', 'fees', 'payment', 'collection'],
    },
    {
      label: 'Library Books',
      route: '/management/library',
      keywords: ['library', 'book', 'books'],
    },
    {
      label: 'Library Members',
      route: '/management/library-members',
      keywords: ['library member', 'library members'],
    },
    {
      label: 'Routes',
      route: '/management/routes',
      keywords: ['route', 'routes', 'transport', 'bus'],
    },
    {
      label: 'Hostels',
      route: '/management/hostels',
      keywords: ['hostel', 'hostels', 'beds'],
    },
    {
      label: 'Sports',
      route: '/management/sports',
      keywords: ['sport', 'sports'],
    },
    {
      label: 'Events',
      route: '/management/events',
      keywords: ['event', 'events', 'calendar'],
    },
    {
      label: 'Staffs',
      route: '/hrm/staffs',
      keywords: ['staff', 'staffs', 'employee'],
    },
    {
      label: 'Designations',
      route: '/hrm/designations',
      keywords: ['designation', 'designations'],
    },
    {
      label: 'Departments',
      route: '/hrm/departments',
      keywords: ['department', 'departments'],
    },
    {
      label: 'Holidays',
      route: '/hrm/holidays',
      keywords: ['holiday', 'holidays'],
    },
    {
      label: 'Leave',
      route: '/hrm/leaves',
      keywords: ['leave', 'leaves'],
    },
    {
      label: 'Student Attendance',
      route: '/hrm/student-attendance',
      keywords: ['student attendance', 'mark student attendance'],
    },
    {
      label: 'Teacher Attendance',
      route: '/hrm/teacher-attendance',
      keywords: ['teacher attendance', 'mark teacher attendance'],
    },
    {
      label: 'Staff Attendance',
      route: '/hrm/staff-attendance',
      keywords: ['staff attendance', 'mark staff attendance'],
    },
    {
      label: 'Payroll',
      route: '/hrm/payroll',
      keywords: ['payroll', 'salary'],
    },
    {
      label: 'Daily Attendance Report',
      route: '/reports/daily-attendance',
      keywords: ['daily attendance', 'attendance report'],
    },
    {
      label: 'Student Day Wise Report',
      route: '/reports/student-day-wise',
      keywords: ['student day wise', 'student report'],
    },
    {
      label: 'Teacher Day Wise Report',
      route: '/reports/teacher-day-wise',
      keywords: ['teacher day wise', 'teacher report'],
    },
    {
      label: 'Staff Day Wise Report',
      route: '/reports/staff-day-wise',
      keywords: ['staff day wise', 'staff report'],
    },
  ];

  get displayName(): string {
    return this.currentUser()?.fullName || 'Admin User';
  }

  get displayRole(): string {
    return this.currentUser()?.role?.replace('_', ' ') || 'ADMIN';
  }

  get initials(): string {
    const name = this.displayName.trim();

    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  get filteredQuickLinks(): QuickSearchItem[] {
    const query = this.searchTerm.trim().toLowerCase();

    if (!query) {
      return [];
    }

    return this.quickSearchItems
      .filter((item) => {
        const labelMatch = item.label.toLowerCase().includes(query);
        const keywordMatch = item.keywords.some((keyword) =>
          keyword.toLowerCase().includes(query),
        );

        return labelMatch || keywordMatch;
      })
      .slice(0, 7);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/auth/login');
  }

  openSearch(): void {
    this.isSearchOpen = true;
  }

  closeSearchWithDelay(): void {
    setTimeout(() => {
      this.isSearchOpen = false;
    }, 160);
  }

  runQuickSearch(): void {
    const firstResult = this.filteredQuickLinks[0];

    if (!firstResult) {
      return;
    }

    this.navigateToQuickLink(firstResult);
  }

  navigateToQuickLink(item: QuickSearchItem): void {
    this.searchTerm = '';
    this.isSearchOpen = false;
    this.router.navigateByUrl(item.route);
  }

  private readonly academicYearStartMonth = 1; // September

  get academicYearLabel(): string {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    const startYear =
      currentMonth >= this.academicYearStartMonth
        ? currentYear
        : currentYear - 1;

    const endYear = startYear + 1;

    return `${startYear} / ${endYear}`;
  }
}
