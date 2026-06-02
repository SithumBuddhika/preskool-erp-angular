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
        redirectTo: 'management/fees',
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
        path: 'hrm/holiday',
        pathMatch: 'full',
        redirectTo: 'hrm/holidays',
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
        path: 'hrm/student-attendances',
        pathMatch: 'full',
        redirectTo: 'hrm/student-attendance',
      },
      {
        path: 'hrm/attendance',
        pathMatch: 'full',
        redirectTo: 'hrm/student-attendance',
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
        path: 'reports/attendance-report',
        pathMatch: 'full',
        redirectTo: 'reports/attendance',
      },
      {
        path: 'reports/student',
        pathMatch: 'full',
        redirectTo: 'reports/attendance',
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
