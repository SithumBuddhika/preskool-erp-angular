import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const appRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard/admin',
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./core/layouts/auth-layout/auth-layout.component').then(
        (m) => m.AuthLayoutComponent,
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login',
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then(
            (m) => m.LoginComponent,
          ),
      },
      {
        path: 'sign-up',
        loadComponent: () =>
          import('./features/auth/sign-up/sign-up.component').then(
            (m) => m.SignUpComponent,
          ),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import(
            './features/auth/forgot-password/forgot-password.component'
          ).then((m) => m.ForgotPasswordComponent),
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import(
            './features/auth/reset-password/reset-password.component'
          ).then((m) => m.ResetPasswordComponent),
      },
      {
        path: 'reset-password-sent',
        loadComponent: () =>
          import(
            './features/auth/reset-password-sent/reset-password-sent.component'
          ).then((m) => m.ResetPasswordSentComponent),
      },
      {
        path: 'email-verification',
        loadComponent: () =>
          import(
            './features/auth/email-verification/email-verification.component'
          ).then((m) => m.EmailVerificationComponent),
      },
      {
        path: 'two-step-verification',
        loadComponent: () =>
          import(
            './features/auth/two-step-verification/two-step-verification.component'
          ).then((m) => m.TwoStepVerificationComponent),
      },
    ],
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/layouts/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent,
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard/admin',
      },
      {
        path: 'dashboard',
        pathMatch: 'full',
        redirectTo: 'dashboard/admin',
      },
      {
        path: 'dashboard/admin',
        loadComponent: () =>
          import(
            './features/dashboard/admin-dashboard/admin-dashboard.component'
          ).then((m) => m.AdminDashboardComponent),
      },
      {
        path: 'dashboard/student',
        loadComponent: () =>
          import(
            './features/dashboard/student-dashboard/student-dashboard.component'
          ).then((m) => m.StudentDashboardComponent),
      },
      {
        path: 'dashboard/teacher',
        loadComponent: () =>
          import(
            './features/dashboard/teacher-dashboard/teacher-dashboard.component'
          ).then((m) => m.TeacherDashboardComponent),
      },

      {
        path: 'people',
        pathMatch: 'full',
        redirectTo: 'people/students',
      },
      {
        path: 'people/students',
        loadComponent: () =>
          import('./features/people/students/students.component').then(
            (m) => m.StudentsComponent,
          ),
      },
      {
        path: 'people/parents',
        loadComponent: () =>
          import('./features/people/parents/parents.component').then(
            (m) => m.ParentsComponent,
          ),
      },
      {
        path: 'people/guardians',
        loadComponent: () =>
          import('./features/people/guardians/guardians.component').then(
            (m) => m.GuardiansComponent,
          ),
      },
      {
        path: 'people/teachers',
        loadComponent: () =>
          import('./features/people/teachers/teachers.component').then(
            (m) => m.TeachersComponent,
          ),
      },

      {
        path: 'academic',
        pathMatch: 'full',
        redirectTo: 'academic/classes',
      },
      {
        path: 'academic/classes',
        loadComponent: () =>
          import('./features/academic/classes/classes.component').then(
            (m) => m.ClassesComponent,
          ),
      },
      {
        path: 'academic/class-room',
        pathMatch: 'full',
        redirectTo: 'academic/class-rooms',
      },
      {
        path: 'academic/class-rooms',
        loadComponent: () =>
          import('./features/academic/class-rooms/class-rooms.component').then(
            (m) => m.ClassRoomsComponent,
          ),
      },
      {
        path: 'academic/subject',
        pathMatch: 'full',
        redirectTo: 'academic/subjects',
      },
      {
        path: 'academic/subjects',
        loadComponent: () =>
          import('./features/academic/subjects/subjects.component').then(
            (m) => m.SubjectsComponent,
          ),
      },
      {
        path: 'academic/class-routine',
        loadComponent: () =>
          import(
            './features/academic/class-routine/class-routine.component'
          ).then((m) => m.ClassRoutineComponent),
      },
      {
        path: 'academic/class-routines',
        pathMatch: 'full',
        redirectTo: 'academic/class-routine',
      },
      {
        path: 'academic/exam-schedule',
        loadComponent: () =>
          import('./features/academic/exams/exams.component').then(
            (m) => m.ExamsComponent,
          ),
      },
      {
        path: 'academic/exams',
        pathMatch: 'full',
        redirectTo: 'academic/exam-schedule',
      },
      {
        path: 'academic/grades',
        loadComponent: () =>
          import('./features/academic/grades/grades.component').then(
            (m) => m.GradesComponent,
          ),
      },
      {
        path: 'academic/grade',
        pathMatch: 'full',
        redirectTo: 'academic/grades',
      },
      {
        path: 'academic/syllabus-subject-groups',
        loadComponent: () =>
          import(
            './features/academic/syllabus-subject-groups/syllabus-subject-groups.component'
          ).then((m) => m.SyllabusSubjectGroupsComponent),
      },
      {
        path: 'academic/syllabus-subject-group',
        pathMatch: 'full',
        redirectTo: 'academic/syllabus-subject-groups',
      },
      {
        path: 'academic/subject-groups',
        pathMatch: 'full',
        redirectTo: 'academic/syllabus-subject-groups',
      },
      {
        path: 'academic/time-table',
        loadComponent: () =>
          import('./features/academic/time-table/time-table.component').then(
            (m) => m.TimeTableComponent,
          ),
      },
      {
        path: 'academic/timetable',
        pathMatch: 'full',
        redirectTo: 'academic/time-table',
      },

      {
        path: 'applications',
        pathMatch: 'full',
        redirectTo: 'dashboard/admin',
      },

      {
        path: 'management',
        pathMatch: 'full',
        redirectTo: 'management/fee-groups',
      },
      {
        path: 'management/fee-groups',
        loadComponent: () =>
          import('./features/management/fee-groups/fee-groups.component').then(
            (m) => m.FeeGroupsComponent,
          ),
      },
      {
        path: 'management/fee-group',
        pathMatch: 'full',
        redirectTo: 'management/fee-groups',
      },
      {
        path: 'management/fees',
        loadComponent: () =>
          import('./features/management/fees/fees.component').then(
            (m) => m.FeesComponent,
          ),
      },
      {
        path: 'management/fees-collection',
        pathMatch: 'full',
        redirectTo: 'management/fees',
      },
      {
        path: 'management/library',
        loadComponent: () =>
          import('./features/management/library/library.component').then(
            (m) => m.LibraryComponent,
          ),
      },
      {
        path: 'management/library-books',
        pathMatch: 'full',
        redirectTo: 'management/library',
      },
      {
        path: 'management/library-members',
        loadComponent: () =>
          import(
            './features/management/library-members/library-members.component'
          ).then((m) => m.LibraryMembersComponent),
      },
      {
        path: 'management/routes',
        loadComponent: () =>
          import('./features/management/routes/routes.component').then(
            (m) => m.RoutesComponent,
          ),
      },
      {
        path: 'management/route',
        pathMatch: 'full',
        redirectTo: 'management/routes',
      },
      {
        path: 'management/hostels',
        loadComponent: () =>
          import('./features/management/hostels/hostels.component').then(
            (m) => m.HostelsComponent,
          ),
      },
      {
        path: 'management/hostel',
        pathMatch: 'full',
        redirectTo: 'management/hostels',
      },
      {
        path: 'management/sports',
        loadComponent: () =>
          import('./features/management/sports/sports.component').then(
            (m) => m.SportsComponent,
          ),
      },
      {
        path: 'management/sport',
        pathMatch: 'full',
        redirectTo: 'management/sports',
      },
      {
        path: 'management/events',
        loadComponent: () =>
          import('./features/management/events/events.component').then(
            (m) => m.EventsComponent,
          ),
      },
      {
        path: 'management/event',
        pathMatch: 'full',
        redirectTo: 'management/events',
      },

      {
        path: 'hrm',
        pathMatch: 'full',
        redirectTo: 'hrm/departments',
      },
      {
        path: 'hrm/departments',
        loadComponent: () =>
          import('./features/hrm/departments/departments.component').then(
            (m) => m.DepartmentsComponent,
          ),
      },
      {
        path: 'hrm/department',
        pathMatch: 'full',
        redirectTo: 'hrm/departments',
      },
      {
        path: 'hrm/designations',
        loadComponent: () =>
          import('./features/hrm/designations/designations.component').then(
            (m) => m.DesignationsComponent,
          ),
      },
      {
        path: 'hrm/designation',
        pathMatch: 'full',
        redirectTo: 'hrm/designations',
      },
      {
        path: 'hrm/staffs',
        loadComponent: () =>
          import('./features/hrm/staffs/staffs.component').then(
            (m) => m.StaffsComponent,
          ),
      },
      {
        path: 'hrm/staff',
        pathMatch: 'full',
        redirectTo: 'hrm/staffs',
      },
      {
        path: 'hrm/holidays',
        loadComponent: () =>
          import('./features/hrm/holidays/holidays.component').then(
            (m) => m.HolidaysComponent,
          ),
      },
      {
        path: 'hrm/leaves',
        loadComponent: () =>
          import('./features/hrm/leaves/leaves.component').then(
            (m) => m.LeavesComponent,
          ),
      },
      {
        path: 'hrm/leave',
        pathMatch: 'full',
        redirectTo: 'hrm/leaves',
      },
      {
        path: 'hrm/student-attendance',
        loadComponent: () =>
          import(
            './features/hrm/student-attendance/student-attendance.component'
          ).then((m) => m.StudentAttendanceComponent),
      },
      {
        path: 'hrm/teacher-attendance',
        loadComponent: () =>
          import(
            './features/hrm/teacher-attendance/teacher-attendance.component'
          ).then((m) => m.TeacherAttendanceComponent),
      },
      {
        path: 'hrm/staff-attendance',
        loadComponent: () =>
          import(
            './features/hrm/staff-attendance/staff-attendance.component'
          ).then((m) => m.StaffAttendanceComponent),
      },
      {
        path: 'hrm/payroll',
        loadComponent: () =>
          import('./features/hrm/payroll/payroll.component').then(
            (m) => m.PayrollComponent,
          ),
      },

      {
        path: 'reports',
        pathMatch: 'full',
        redirectTo: 'reports/attendance',
      },
      {
        path: 'reports/attendance',
        loadComponent: () =>
          import(
            './features/reports/attendance-report/attendance-report.component'
          ).then((m) => m.AttendanceReportComponent),
      },
      {
        path: 'reports/student-attendance-type',
        loadComponent: () =>
          import(
            './features/reports/student-attendance-type/student-attendance-type.component'
          ).then((m) => m.StudentAttendanceTypeComponent),
      },
      {
        path: 'reports/daily-attendance',
        loadComponent: () =>
          import(
            './features/reports/daily-attendance/daily-attendance.component'
          ).then((m) => m.DailyAttendanceComponent),
      },
      {
        path: 'reports/student-day-wise',
        loadComponent: () =>
          import(
            './features/reports/student-day-wise/student-day-wise.component'
          ).then((m) => m.StudentDayWiseComponent),
      },
      {
        path: 'reports/teacher-day-wise',
        loadComponent: () =>
          import(
            './features/reports/teacher-day-wise/teacher-day-wise.component'
          ).then((m) => m.TeacherDayWiseComponent),
      },
      {
        path: 'reports/teacher-report',
        loadComponent: () =>
          import(
            './features/reports/teacher-report/teacher-report.component'
          ).then((m) => m.TeacherReportComponent),
      },
      {
        path: 'reports/staff-day-wise',
        loadComponent: () =>
          import(
            './features/reports/staff-day-wise/staff-day-wise.component'
          ).then((m) => m.StaffDayWiseComponent),
      },
      {
        path: 'reports/staff-report',
        loadComponent: () =>
          import('./features/reports/staff-report/staff-report.component').then(
            (m) => m.StaffReportComponent,
          ),
      },

      {
        path: '**',
        redirectTo: 'dashboard/admin',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard/admin',
  },
];
