import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  CreateStaffAttendancePayload,
  StaffAttendance,
  StaffAttendanceStatus,
} from '../../../core/models/staff-attendance.model';
import { StaffAttendanceService } from '../../../core/services/staff-attendance.service';
import { StaffsService } from '../../../core/services/staffs.service';

type ToastType = 'success' | 'error';

type StaffOption = {
  id?: string;
  staffCode?: string;
  employeeNo?: string;
  staffNo?: string;
  code?: string;
  staffName?: string;
  fullName?: string;
  name?: string;
  department?: string | null;
  departmentName?: string | null;
  designation?: string | null;
  designationName?: string | null;
};

@Component({
  selector: 'app-staff-attendance',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './staff-attendance.component.html',
  styleUrl: './staff-attendance.component.scss',
})
export class StaffAttendanceComponent implements OnInit {
  attendanceRecords = signal<StaffAttendance[]>([]);
  staffSuggestions = signal<StaffOption[]>([]);

  selectedAttendance = signal<StaffAttendance | null>(null);
  attendanceToDelete = signal<StaffAttendance | null>(null);

  isLoading = signal(false);
  isSubmitting = signal(false);
  isDeleting = signal(false);
  showAttendanceModal = signal(false);
  showStaffSuggestions = signal(false);

  serverError = signal('');
  searchTerm = signal('');
  selectedDate = signal(this.getTodayDate());

  toast = signal<{ message: string; type: ToastType } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  isEditMode = computed(() => this.selectedAttendance() !== null);

  presentCount = computed(
    () =>
      this.attendanceRecords().filter((item) => item.status === 'PRESENT')
        .length,
  );

  absentCount = computed(
    () =>
      this.attendanceRecords().filter((item) => item.status === 'ABSENT')
        .length,
  );

  lateCount = computed(
    () =>
      this.attendanceRecords().filter((item) => item.status === 'LATE').length,
  );

  halfDayCount = computed(
    () =>
      this.attendanceRecords().filter((item) => item.status === 'HALF_DAY')
        .length,
  );

  attendanceForm = new FormGroup({
    staffId: new FormControl('', {
      nonNullable: true,
    }),
    staffCode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    staffName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    department: new FormControl('', {
      nonNullable: true,
    }),
    designation: new FormControl('', {
      nonNullable: true,
    }),
    attendanceDate: new FormControl(this.getTodayDate(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    status: new FormControl<StaffAttendanceStatus>('PRESENT', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    remarks: new FormControl('', {
      nonNullable: true,
    }),
  });

  constructor(
    private readonly staffAttendanceService: StaffAttendanceService,
    private readonly staffsService: StaffsService,
  ) {}

  ngOnInit(): void {
    this.loadAttendance();
  }

  loadAttendance(search = this.searchTerm(), date = this.selectedDate()): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.staffAttendanceService.getStaffAttendance(search, date).subscribe({
      next: (records) => {
        this.attendanceRecords.set(records);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.serverError.set(
          error?.error?.message || 'Failed to load staff attendance.',
        );
        this.isLoading.set(false);
        this.showToast('Failed to load staff attendance.', 'error');
      },
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.searchTerm.set(value);
    this.loadAttendance(value, this.selectedDate());
  }

  onDateFilterChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.selectedDate.set(value);
    this.loadAttendance(this.searchTerm(), value);
  }

  openCreateModal(): void {
    this.selectedAttendance.set(null);

    this.attendanceForm.reset({
      staffId: '',
      staffCode: '',
      staffName: '',
      department: '',
      designation: '',
      attendanceDate: this.selectedDate() || this.getTodayDate(),
      status: 'PRESENT',
      remarks: '',
    });

    this.staffSuggestions.set([]);
    this.showStaffSuggestions.set(false);
    this.serverError.set('');
    this.showAttendanceModal.set(true);
  }

  openEditModal(record: StaffAttendance): void {
    this.selectedAttendance.set(record);

    this.attendanceForm.reset({
      staffId: record.staffId || '',
      staffCode: record.staffCode,
      staffName: record.staffName,
      department: record.department || '',
      designation: record.designation || '',
      attendanceDate: this.toInputDate(record.attendanceDate),
      status: record.status,
      remarks: record.remarks || '',
    });

    this.staffSuggestions.set([]);
    this.showStaffSuggestions.set(false);
    this.serverError.set('');
    this.showAttendanceModal.set(true);
  }

  closeAttendanceModal(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.showAttendanceModal.set(false);
    this.selectedAttendance.set(null);
    this.staffSuggestions.set([]);
    this.showStaffSuggestions.set(false);
    this.serverError.set('');
  }

  onStaffNameInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.attendanceForm.controls.staffName.setValue(value);
    this.attendanceForm.controls.staffId.setValue('');

    if (!value.trim()) {
      this.staffSuggestions.set([]);
      this.showStaffSuggestions.set(false);
      return;
    }

    this.loadStaffSuggestions(value);
  }

  loadStaffSuggestions(search: string): void {
    this.staffsService.getStaffs(search).subscribe({
      next: (staffs) => {
        this.staffSuggestions.set(staffs as StaffOption[]);
        this.showStaffSuggestions.set(true);
      },
      error: () => {
        this.staffSuggestions.set([]);
        this.showStaffSuggestions.set(false);
      },
    });
  }

  selectStaff(staff: StaffOption): void {
    this.attendanceForm.patchValue({
      staffId: staff.id || '',
      staffCode: this.getStaffCode(staff),
      staffName: this.getStaffName(staff),
      department: this.getStaffDepartment(staff),
      designation: this.getStaffDesignation(staff),
    });

    this.staffSuggestions.set([]);
    this.showStaffSuggestions.set(false);
  }

  saveAttendance(): void {
    this.attendanceForm.markAllAsTouched();
    this.serverError.set('');

    if (this.attendanceForm.invalid || this.isSubmitting()) {
      return;
    }

    const selectedRecord = this.selectedAttendance();
    const payload = this.buildAttendancePayload();

    this.isSubmitting.set(true);

    if (selectedRecord) {
      this.staffAttendanceService
        .updateStaffAttendance(selectedRecord.id, payload)
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.closeAttendanceModal();
            this.loadAttendance();
            this.showToast('Staff attendance updated successfully.', 'success');
          },
          error: (error) => {
            this.isSubmitting.set(false);
            this.serverError.set(
              error?.error?.message || 'Failed to update attendance.',
            );
            this.showToast('Failed to update attendance.', 'error');
          },
        });

      return;
    }

    this.staffAttendanceService.createStaffAttendance(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeAttendanceModal();
        this.loadAttendance();
        this.showToast('Staff attendance marked successfully.', 'success');
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.serverError.set(
          error?.error?.message || 'Failed to mark attendance.',
        );
        this.showToast('Failed to mark attendance.', 'error');
      },
    });
  }

  openDeleteModal(record: StaffAttendance): void {
    this.attendanceToDelete.set(record);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.attendanceToDelete.set(null);
  }

  confirmDeleteAttendance(): void {
    const record = this.attendanceToDelete();

    if (!record || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);

    this.staffAttendanceService.deleteStaffAttendance(record.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.attendanceToDelete.set(null);
        this.loadAttendance();
        this.showToast('Attendance deleted successfully.', 'success');
      },
      error: (error) => {
        this.isDeleting.set(false);
        this.attendanceToDelete.set(null);
        this.serverError.set(
          error?.error?.message || 'Failed to delete attendance.',
        );
        this.showToast('Failed to delete attendance.', 'error');
      },
    });
  }

  getStatusLabel(status: StaffAttendanceStatus): string {
    if (status === 'HALF_DAY') {
      return 'Half Day';
    }

    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  getStatusClass(status: StaffAttendanceStatus): string {
    return `status-pill--${status.toLowerCase().replace('_', '-')}`;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  }

  getStaffInitial(record: StaffAttendance): string {
    return record.staffName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase();
  }

  isInvalid(controlName: keyof typeof this.attendanceForm.controls): boolean {
    const control = this.attendanceForm.controls[controlName];

    return control.invalid && control.touched;
  }

  private buildAttendancePayload(): CreateStaffAttendancePayload {
    const formValue = this.attendanceForm.getRawValue();

    const payload: CreateStaffAttendancePayload = {
      staffCode: formValue.staffCode.trim(),
      staffName: formValue.staffName.trim(),
      attendanceDate: formValue.attendanceDate,
      status: formValue.status,
    };

    if (formValue.staffId.trim()) {
      payload.staffId = formValue.staffId.trim();
    }

    if (formValue.department.trim()) {
      payload.department = formValue.department.trim();
    }

    if (formValue.designation.trim()) {
      payload.designation = formValue.designation.trim();
    }

    if (formValue.remarks.trim()) {
      payload.remarks = formValue.remarks.trim();
    }

    return payload;
  }

  private getStaffCode(staff: StaffOption): string {
    return (
      staff.staffCode || staff.employeeNo || staff.staffNo || staff.code || ''
    );
  }

  private getStaffName(staff: StaffOption): string {
    return staff.staffName || staff.fullName || staff.name || '';
  }

  private getStaffDepartment(staff: StaffOption): string {
    return staff.department || staff.departmentName || '';
  }

  private getStaffDesignation(staff: StaffOption): string {
    return staff.designation || staff.designationName || '';
  }

  private toInputDate(date: string): string {
    return new Date(date).toISOString().slice(0, 10);
  }

  private getTodayDate(): string {
    return new Date().toISOString().slice(0, 10);
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
