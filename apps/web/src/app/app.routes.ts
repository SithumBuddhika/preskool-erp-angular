import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const appRoutes: Routes = [
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
        path: 'dashboard/admin',
        loadComponent: () =>
          import(
            './features/dashboard/admin-dashboard/admin-dashboard.component'
          ).then((m) => m.AdminDashboardComponent),
      },
    ],
  },
  {
    path: 'auth',
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
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/login/login.component').then(
            (m) => m.LoginComponent,
          ),
      },
      {
        path: 'sign-up',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/sign-up/sign-up.component').then(
            (m) => m.SignUpComponent,
          ),
      },
      {
        path: 'forgot-password',
        canActivate: [guestGuard],
        loadComponent: () =>
          import(
            './features/auth/forgot-password/forgot-password.component'
          ).then((m) => m.ForgotPasswordComponent),
      },
      {
        path: 'reset-password',
        canActivate: [guestGuard],
        loadComponent: () =>
          import(
            './features/auth/reset-password/reset-password.component'
          ).then((m) => m.ResetPasswordComponent),
      },
      {
        path: 'reset-password-sent',
        canActivate: [guestGuard],
        loadComponent: () =>
          import(
            './features/auth/reset-password-sent/reset-password-sent.component'
          ).then((m) => m.ResetPasswordSentComponent),
      },
      {
        path: 'email-verification',
        canActivate: [guestGuard],
        loadComponent: () =>
          import(
            './features/auth/email-verification/email-verification.component'
          ).then((m) => m.EmailVerificationComponent),
      },
      {
        path: 'two-step-verification',
        canActivate: [guestGuard],
        loadComponent: () =>
          import(
            './features/auth/two-step-verification/two-step-verification.component'
          ).then((m) => m.TwoStepVerificationComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard/admin',
  },
];
