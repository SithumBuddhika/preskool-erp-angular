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
        path: 'academic/class-rooms',
        loadComponent: () =>
          import('./features/academic/class-rooms/class-rooms.component').then(
            (m) => m.ClassRoomsComponent,
          ),
      },
      {
        path: 'academic/subjects',
        loadComponent: () =>
          import('./features/academic/subjects/subjects.component').then(
            (m) => m.SubjectsComponent,
          ),
      },
    ],
  },

  {
    path: '**',
    redirectTo: 'dashboard/admin',
  },
];
