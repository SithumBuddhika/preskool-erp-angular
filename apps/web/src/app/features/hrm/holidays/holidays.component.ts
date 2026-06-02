import { Component, OnInit, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  CreateHolidayPayload,
  Holiday,
  HolidayStatus,
  HolidayType,
} from '../../../core/models/holiday.model';
import { HolidaysService } from '../../../core/services/holidays.service';

type ToastType = 'success' | 'error';

@Component({
  selector: 'app-holidays',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './holidays.component.html',
  styleUrl: './holidays.component.scss',
})
export class HolidaysComponent implements OnInit {
  holidays = signal<Holiday[]>([]);
  selectedHoliday = signal<Holiday | null>(null);
  holidayToDelete = signal<Holiday | null>(null);

  isLoading = signal(false);
  isSubmitting = signal(false);
  isDeleting = signal(false);
  showHolidayModal = signal(false);

  serverError = signal('');
  searchTerm = signal('');

  toast = signal<{ message: string; type: ToastType } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  isEditMode = computed(() => this.selectedHoliday() !== null);

  activeHolidays = computed(
    () =>
      this.holidays().filter((holiday) => holiday.status === 'ACTIVE').length,
  );

  inactiveHolidays = computed(
    () =>
      this.holidays().filter((holiday) => holiday.status === 'INACTIVE').length,
  );

  publicHolidays = computed(
    () =>
      this.holidays().filter((holiday) => holiday.holidayType === 'PUBLIC')
        .length,
  );

  upcomingHolidays = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.holidays().filter((holiday) => {
      const endDate = new Date(holiday.endDate);
      endDate.setHours(0, 0, 0, 0);

      return endDate >= today && holiday.status === 'ACTIVE';
    }).length;
  });

  holidayForm = new FormGroup({
    holidayCode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    startDate: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    endDate: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    holidayType: new FormControl<HolidayType>('PUBLIC', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    description: new FormControl('', {
      nonNullable: true,
    }),
    status: new FormControl<HolidayStatus>('ACTIVE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor(private readonly holidaysService: HolidaysService) {}

  ngOnInit(): void {
    this.loadHolidays();
  }

  loadHolidays(search = this.searchTerm()): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.holidaysService.getHolidays(search).subscribe({
      next: (holidays) => {
        this.holidays.set(holidays);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.serverError.set(
          error?.error?.message || 'Failed to load holidays.',
        );
        this.isLoading.set(false);
        this.showToast('Failed to load holidays.', 'error');
      },
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.loadHolidays(value);
  }

  openCreateModal(): void {
    this.selectedHoliday.set(null);

    this.holidayForm.reset({
      holidayCode: '',
      title: '',
      startDate: '',
      endDate: '',
      holidayType: 'PUBLIC',
      description: '',
      status: 'ACTIVE',
    });

    this.holidaysService.generateNextHolidayCode().subscribe({
      next: (holidayCode) => {
        this.holidayForm.controls.holidayCode.setValue(holidayCode);
      },
      error: () => {
        this.holidayForm.controls.holidayCode.setValue('HLD-0001');
        this.showToast('Could not generate next holiday ID.', 'error');
      },
    });

    this.serverError.set('');
    this.showHolidayModal.set(true);
  }

  openEditModal(holiday: Holiday): void {
    this.selectedHoliday.set(holiday);

    this.holidayForm.reset({
      holidayCode: holiday.holidayCode,
      title: holiday.title,
      startDate: this.formatDateForInput(holiday.startDate),
      endDate: this.formatDateForInput(holiday.endDate),
      holidayType: holiday.holidayType,
      description: holiday.description || '',
      status: holiday.status,
    });

    this.serverError.set('');
    this.showHolidayModal.set(true);
  }

  closeHolidayModal(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.showHolidayModal.set(false);
    this.selectedHoliday.set(null);
    this.serverError.set('');
  }

  saveHoliday(): void {
    this.holidayForm.markAllAsTouched();
    this.serverError.set('');

    if (this.holidayForm.invalid || this.isSubmitting()) {
      return;
    }

    if (!this.isDateRangeValid()) {
      this.serverError.set('End date cannot be before start date.');
      return;
    }

    const selectedHoliday = this.selectedHoliday();
    const payload = this.buildHolidayPayload();

    this.isSubmitting.set(true);

    if (selectedHoliday) {
      this.holidaysService
        .updateHoliday(selectedHoliday.id, payload)
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.closeHolidayModal();
            this.loadHolidays();
            this.showToast('Holiday updated successfully.', 'success');
          },
          error: (error) => {
            this.isSubmitting.set(false);
            this.serverError.set(
              error?.error?.message || 'Failed to update holiday.',
            );
            this.showToast('Failed to update holiday.', 'error');
          },
        });

      return;
    }

    this.holidaysService.createHoliday(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeHolidayModal();
        this.loadHolidays();
        this.showToast('Holiday added successfully.', 'success');
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.serverError.set(
          error?.error?.message || 'Failed to create holiday.',
        );
        this.showToast('Failed to create holiday.', 'error');
      },
    });
  }

  openDeleteModal(holiday: Holiday): void {
    this.holidayToDelete.set(holiday);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.holidayToDelete.set(null);
  }

  confirmDeleteHoliday(): void {
    const holiday = this.holidayToDelete();

    if (!holiday || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);

    this.holidaysService.deleteHoliday(holiday.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.holidayToDelete.set(null);
        this.loadHolidays();
        this.showToast('Holiday deleted successfully.', 'success');
      },
      error: (error) => {
        this.isDeleting.set(false);
        this.holidayToDelete.set(null);
        this.serverError.set(
          error?.error?.message || 'Failed to delete holiday.',
        );
        this.showToast('Failed to delete holiday.', 'error');
      },
    });
  }

  getHolidayTypeLabel(type: HolidayType): string {
    return type.charAt(0) + type.slice(1).toLowerCase();
  }

  getStatusLabel(status: HolidayStatus): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  getInitials(holiday: Holiday): string {
    return holiday.title
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }

  getDurationDays(holiday: Holiday): number {
    const start = new Date(holiday.startDate);
    const end = new Date(holiday.endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const difference = end.getTime() - start.getTime();
    const days = Math.floor(difference / (1000 * 60 * 60 * 24)) + 1;

    return Math.max(days, 1);
  }

  formatDisplayDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  }

  isInvalid(controlName: keyof typeof this.holidayForm.controls): boolean {
    const control = this.holidayForm.controls[controlName];
    return control.invalid && control.touched;
  }

  isDateRangeValid(): boolean {
    const startDate = this.holidayForm.controls.startDate.value;
    const endDate = this.holidayForm.controls.endDate.value;

    if (!startDate || !endDate) {
      return true;
    }

    return new Date(endDate) >= new Date(startDate);
  }

  private buildHolidayPayload(): CreateHolidayPayload {
    const formValue = this.holidayForm.getRawValue();

    const payload: CreateHolidayPayload = {
      holidayCode: formValue.holidayCode.trim(),
      title: formValue.title.trim(),
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      holidayType: formValue.holidayType,
      status: formValue.status,
    };

    if (formValue.description.trim()) {
      payload.description = formValue.description.trim();
    }

    return payload;
  }

  private formatDateForInput(date: string): string {
    if (!date) {
      return '';
    }

    return new Date(date).toISOString().split('T')[0];
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
