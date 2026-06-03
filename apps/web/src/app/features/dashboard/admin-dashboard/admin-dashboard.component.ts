import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  AdminUser,
  AdminUserRole,
  CreateAdminUserPayload,
  UpdateAdminUserPayload,
} from '../../../core/models/admin-user.model';
import {
  AdminDashboardData,
  AdminDashboardDataService,
  DashboardCalendarItem,
} from '../../../core/services/admin-dashboard-data.service';
import { AdminUsersService } from '../../../core/services/admin-users.service';
import { AuthService } from '../../../core/services/auth.service';
import { PageTitleComponent } from '../../../shared/components/page-title/page-title.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';

type ToastType = 'success' | 'error';

type CalendarDay = {
  label: string;
  dateKey: string;
  active: boolean;
  title: string;
  activeType?: DashboardCalendarItem['type'];
  count: number;
};

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PageTitleComponent,
    StatCardComponent,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  dashboardData = signal<AdminDashboardData | null>(null);
  isDashboardLoading = signal(false);
  dashboardError = signal('');

  adminUsers = signal<AdminUser[]>([]);
  selectedAdminUser = signal<AdminUser | null>(null);
  adminUserToDelete = signal<AdminUser | null>(null);

  isAdminUsersLoading = signal(false);
  isAdminSubmitting = signal(false);
  isAdminDeleting = signal(false);
  isStatusUpdating = signal<string | null>(null);

  showAdminUsersPanel = signal(false);
  showAdminUserModal = signal(false);
  adminUserError = signal('');

  toast = signal<{ message: string; type: ToastType } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  isAdminEditMode = computed(() => this.selectedAdminUser() !== null);

  statCards = computed(() => this.dashboardData()?.statCards || []);
  feeBars = computed(() => this.dashboardData()?.feeBars || []);
  feeSummary = computed(() => this.dashboardData()?.feeSummary);
  attendanceSummary = computed(() => this.dashboardData()?.attendanceSummary);
  quickSummary = computed(() => this.dashboardData()?.quickSummary);
  recentLeaves = computed(() => this.dashboardData()?.recentLeaves || []);
  upcomingItems = computed(() => this.dashboardData()?.upcomingItems || []);
  calendarItems = computed(() => this.dashboardData()?.calendarItems || []);

  currentMonthLabel = computed(() =>
    new Date().toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    }),
  );

  calendarDays = computed<CalendarDay[]>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return Array.from({ length: daysInMonth }).map((_, index) => {
      const dayNumber = index + 1;
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(
        dayNumber,
      ).padStart(2, '0')}`;

      const dayItems = this.calendarItems().filter(
        (item) => item.dateKey === dateKey,
      );

      return {
        label: `${dayNumber}`,
        dateKey,
        active: dayItems.length > 0,
        count: dayItems.length,
        activeType: dayItems[0]?.type,
        title:
          dayItems.length > 0
            ? dayItems
                .map(
                  (item) =>
                    `${item.title} (${this.getCalendarItemLabel(item)})`,
                )
                .join(' | ')
            : 'No holiday, event, or leave added',
      };
    });
  });

  attendancePercent = computed(() => {
    const attendance = this.attendanceSummary();

    if (!attendance || attendance.total === 0) {
      return 0;
    }

    return Math.round((attendance.present / attendance.total) * 100);
  });

  attendanceRingBackground = computed(() => {
    const percent = this.attendancePercent();

    return `conic-gradient(#3d5ee1 0 ${percent}%, #22d3ee ${percent}% ${
      percent + 8
    }%, #eef1f6 ${percent + 8}% 100%)`;
  });

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

  constructor(
    private readonly dashboardDataService: AdminDashboardDataService,
    private readonly adminUsersService: AdminUsersService,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadAdminUsers();
  }

  ngOnDestroy(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  currentAdminName(): string {
    return this.authService.currentUser()?.fullName || 'Admin';
  }

  loadDashboardData(): void {
    this.isDashboardLoading.set(true);
    this.dashboardError.set('');

    this.dashboardDataService.getDashboardData().subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.isDashboardLoading.set(false);
      },
      error: () => {
        this.dashboardError.set('Failed to load dashboard data.');
        this.isDashboardLoading.set(false);
        this.showToast('Failed to load dashboard data.', 'error');
      },
    });
  }

  refreshDashboard(): void {
    this.loadDashboardData();
    this.loadAdminUsers();
    this.showToast('Dashboard refreshed.', 'success');
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

  toggleAdminUsersPanel(): void {
    this.showAdminUsersPanel.update((value) => !value);
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

  getCalendarItemIcon(type: DashboardCalendarItem['type']): string {
    switch (type) {
      case 'HOLIDAY':
        return '🏖️';
      case 'LEAVE':
        return '🧾';
      case 'EVENT':
      default:
        return '📅';
    }
  }

  getCalendarItemLabel(item: DashboardCalendarItem): string {
    if (item.type === 'HOLIDAY') {
      return 'Holiday';
    }

    if (item.type === 'LEAVE') {
      return item.status || 'Leave';
    }

    return item.eventType
      ? item.eventType
          .split('_')
          .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
          .join(' ')
      : 'Event';
  }

  getCalendarItemDate(item: DashboardCalendarItem): string {
    const date = this.formatDate(item.startDate);

    if (
      !item.endDate ||
      item.endDate.slice(0, 10) === item.startDate.slice(0, 10)
    ) {
      return `${date} / ${item.time || 'All Day'}`;
    }

    return `${date} - ${this.formatDate(item.endDate)} / ${
      item.time || 'All Day'
    }`;
  }

  formatDate(date: string): string {
    if (!date) {
      return '-';
    }

    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  }

  formatMoney(value?: number): string {
    return `Rs. ${new Intl.NumberFormat('en-LK').format(
      Math.round(value || 0),
    )}`;
  }

  formatLeaveType(type: string): string {
    return type
      .split('_')
      .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
      .join(' ');
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
