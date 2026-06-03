import { Component, OnInit, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  AdminUser,
  AdminUserRole,
  CreateAdminUserPayload,
  UpdateAdminUserPayload,
} from '../../../core/models/admin-user.model';
import { AdminUsersService } from '../../../core/services/admin-users.service';
import { AuthService } from '../../../core/services/auth.service';
import { PageTitleComponent } from '../../../shared/components/page-title/page-title.component';
import { PaymentAlertComponent } from '../../../shared/components/payment-alert/payment-alert.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { WelcomeBannerComponent } from '../../../shared/components/welcome-banner/welcome-banner.component';
import { WidgetCardComponent } from '../../../shared/components/widget-card/widget-card.component';

type ToastType = 'success' | 'error';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PageTitleComponent,
    PaymentAlertComponent,
    WelcomeBannerComponent,
    StatCardComponent,
    WidgetCardComponent,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  adminUsers = signal<AdminUser[]>([]);
  selectedAdminUser = signal<AdminUser | null>(null);
  adminUserToDelete = signal<AdminUser | null>(null);

  isAdminUsersLoading = signal(false);
  isAdminSubmitting = signal(false);
  isAdminDeleting = signal(false);
  isStatusUpdating = signal<string | null>(null);

  showAdminUserModal = signal(false);
  adminUserError = signal('');

  toast = signal<{ message: string; type: ToastType } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  isAdminEditMode = computed(() => this.selectedAdminUser() !== null);

  activeAdminUsers = computed(
    () => this.adminUsers().filter((user) => user.isActive).length,
  );

  inactiveAdminUsers = computed(
    () => this.adminUsers().filter((user) => !user.isActive).length,
  );

  superAdminUsers = computed(
    () =>
      this.adminUsers().filter((user) => user.role === 'SUPER_ADMIN').length,
  );

  adminUserForm = new FormGroup({
    fullName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[A-Za-z\s]+$/)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
    }),
    role: new FormControl<AdminUserRole>('ADMIN', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  statCards = [
    {
      short: 'S',
      label: 'Total Students',
      value: '3654',
      badge: '1.2%',
      active: '3643',
      inactive: '11',
      color: 'is-orange',
    },
    {
      short: 'T',
      label: 'Total Teachers',
      value: '284',
      badge: '1.2%',
      active: '254',
      inactive: '30',
      color: 'is-blue',
    },
    {
      short: 'SF',
      label: 'Total Staff',
      value: '162',
      badge: '1.2%',
      active: '161',
      inactive: '02',
      color: 'is-green',
    },
    {
      short: 'SB',
      label: 'Total Subjects',
      value: '82',
      badge: '1.2%',
      active: '81',
      inactive: '01',
      color: 'is-purple',
    },
  ];

  feeBars = [
    { collected: 72 },
    { collected: 84 },
    { collected: 78 },
    { collected: 86 },
    { collected: 79 },
    { collected: 68 },
    { collected: 62 },
    { collected: 76 },
    { collected: 83 },
  ];

  calendarDays = Array.from({ length: 35 }).map((_, index) => ({
    label: `${index + 1}`,
    active: [6, 7, 12, 27].includes(index + 1),
  }));

  constructor(
    private readonly adminUsersService: AdminUsersService,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadAdminUsers();
  }

  loadAdminUsers(): void {
    this.isAdminUsersLoading.set(true);
    this.adminUserError.set('');

    this.adminUsersService.getAdminUsers().subscribe({
      next: (users) => {
        this.adminUsers.set(users);
        this.isAdminUsersLoading.set(false);
      },
      error: (error) => {
        this.adminUserError.set(
          error?.error?.message || 'Failed to load admin users.',
        );
        this.isAdminUsersLoading.set(false);
        this.showToast('Failed to load admin users.', 'error');
      },
    });
  }

  openCreateAdminModal(): void {
    this.selectedAdminUser.set(null);

    this.adminUserForm.reset({
      fullName: '',
      email: '',
      password: '',
      role: 'ADMIN',
    });

    this.adminUserError.set('');
    this.showAdminUserModal.set(true);
  }

  openEditAdminModal(user: AdminUser): void {
    this.selectedAdminUser.set(user);

    this.adminUserForm.reset({
      fullName: user.fullName,
      email: user.email,
      password: '',
      role: user.role,
    });

    this.adminUserError.set('');
    this.showAdminUserModal.set(true);
  }

  closeAdminUserModal(): void {
    if (this.isAdminSubmitting()) {
      return;
    }

    this.showAdminUserModal.set(false);
    this.selectedAdminUser.set(null);
    this.adminUserError.set('');
  }

  saveAdminUser(): void {
    this.adminUserForm.markAllAsTouched();
    this.adminUserError.set('');

    if (this.adminUserForm.invalid || this.isAdminSubmitting()) {
      return;
    }

    const selectedUser = this.selectedAdminUser();
    const formValue = this.adminUserForm.getRawValue();
    const password = formValue.password.trim();

    if (!selectedUser && password.length < 7) {
      this.adminUserError.set('Password must be at least 7 characters.');
      return;
    }

    if (selectedUser && password && password.length < 7) {
      this.adminUserError.set('Password must be at least 7 characters.');
      return;
    }

    this.isAdminSubmitting.set(true);

    if (selectedUser) {
      const payload: UpdateAdminUserPayload = {
        fullName: formValue.fullName.trim(),
        email: formValue.email.toLowerCase().trim(),
        role: formValue.role,
      };

      if (password) {
        payload.password = password;
      }

      this.adminUsersService
        .updateAdminUser(selectedUser.id, payload)
        .subscribe({
          next: () => {
            this.isAdminSubmitting.set(false);
            this.closeAdminUserModal();
            this.loadAdminUsers();
            this.showToast('Admin user updated successfully.', 'success');
          },
          error: (error) => {
            this.isAdminSubmitting.set(false);
            this.adminUserError.set(
              error?.error?.message || 'Failed to update admin user.',
            );
            this.showToast('Failed to update admin user.', 'error');
          },
        });

      return;
    }

    const payload: CreateAdminUserPayload = {
      fullName: formValue.fullName.trim(),
      email: formValue.email.toLowerCase().trim(),
      password,
      role: formValue.role,
    };

    this.adminUsersService.createAdminUser(payload).subscribe({
      next: () => {
        this.isAdminSubmitting.set(false);
        this.closeAdminUserModal();
        this.loadAdminUsers();
        this.showToast('Admin user created successfully.', 'success');
      },
      error: (error) => {
        this.isAdminSubmitting.set(false);
        this.adminUserError.set(
          error?.error?.message || 'Failed to create admin user.',
        );
        this.showToast('Failed to create admin user.', 'error');
      },
    });
  }

  toggleAdminStatus(user: AdminUser): void {
    if (this.isCurrentUser(user) || this.isStatusUpdating()) {
      return;
    }

    this.isStatusUpdating.set(user.id);

    this.adminUsersService
      .updateAdminStatus(user.id, { isActive: !user.isActive })
      .subscribe({
        next: () => {
          this.isStatusUpdating.set(null);
          this.loadAdminUsers();
          this.showToast(
            user.isActive
              ? 'Admin user deactivated successfully.'
              : 'Admin user activated successfully.',
            'success',
          );
        },
        error: (error) => {
          this.isStatusUpdating.set(null);
          this.adminUserError.set(
            error?.error?.message || 'Failed to update admin status.',
          );
          this.showToast('Failed to update admin status.', 'error');
        },
      });
  }

  openDeleteAdminModal(user: AdminUser): void {
    if (this.isCurrentUser(user)) {
      this.showToast('You cannot delete your own account.', 'error');
      return;
    }

    this.adminUserToDelete.set(user);
  }

  closeDeleteAdminModal(): void {
    if (this.isAdminDeleting()) {
      return;
    }

    this.adminUserToDelete.set(null);
  }

  confirmDeleteAdminUser(): void {
    const user = this.adminUserToDelete();

    if (!user || this.isAdminDeleting()) {
      return;
    }

    this.isAdminDeleting.set(true);

    this.adminUsersService.deleteAdminUser(user.id).subscribe({
      next: () => {
        this.isAdminDeleting.set(false);
        this.adminUserToDelete.set(null);
        this.loadAdminUsers();
        this.showToast('Admin user deleted successfully.', 'success');
      },
      error: (error) => {
        this.isAdminDeleting.set(false);
        this.adminUserToDelete.set(null);
        this.adminUserError.set(
          error?.error?.message || 'Failed to delete admin user.',
        );
        this.showToast('Failed to delete admin user.', 'error');
      },
    });
  }

  isCurrentUser(user: AdminUser): boolean {
    return this.authService.currentUser()?.id === user.id;
  }

  getRoleLabel(role: AdminUserRole): string {
    return role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin';
  }

  getAdminInitial(user: AdminUser): string {
    return user.fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase();
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  }

  isAdminFormInvalid(
    controlName: keyof typeof this.adminUserForm.controls,
  ): boolean {
    const control = this.adminUserForm.controls[controlName];

    return control.invalid && control.touched;
  }

  private showToast(message: string, type: ToastType): void {
    this.toast.set({ message, type });

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    this.toastTimer = setTimeout(() => {
      this.toast.set(null);
    }, 2800);
  }
}
