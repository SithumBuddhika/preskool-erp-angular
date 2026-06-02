import { Component, OnInit, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  CreateLeavePayload,
  LeaveStatus,
  LeaveType,
  StaffLeave,
} from '../../../core/models/leave.model';
import { Staff } from '../../../core/models/staff.model';
import { LeavesService } from '../../../core/services/leaves.service';
import { StaffsService } from '../../../core/services/staffs.service';

type ToastType = 'success' | 'error';

@Component({
  selector: 'app-leaves',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './leaves.component.html',
  styleUrl: './leaves.component.scss',
})
export class LeavesComponent implements OnInit {
  leaves = signal<StaffLeave[]>([]);
  staffs = signal<Staff[]>([]);

  selectedLeave = signal<StaffLeave | null>(null);
  leaveToDelete = signal<StaffLeave | null>(null);

  isLoading = signal(false);
  isSubmitting = signal(false);
  isDeleting = signal(false);
  showLeaveModal = signal(false);

  serverError = signal('');
  searchTerm = signal('');

  showStaffSuggestions = signal(false);
  staffSearchTerm = signal('');

  toast = signal<{ message: string; type: ToastType } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  leaveForm = new FormGroup({
    leaveCode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    staffCode: new FormControl('', {
      nonNullable: true,
    }),
    staffName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    departmentCode: new FormControl('', {
      nonNullable: true,
    }),
    departmentName: new FormControl('', {
      nonNullable: true,
    }),
    designationCode: new FormControl('', {
      nonNullable: true,
    }),
    designation: new FormControl('', {
      nonNullable: true,
    }),
    leaveType: new FormControl<LeaveType>('SICK', {
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
    reason: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    status: new FormControl<LeaveStatus>('PENDING', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    approvedBy: new FormControl('', {
      nonNullable: true,
    }),
    remarks: new FormControl('', {
      nonNullable: true,
    }),
  });

  isEditMode = computed(() => this.selectedLeave() !== null);

  pendingLeaves = computed(
    () => this.leaves().filter((leave) => leave.status === 'PENDING').length,
  );

  approvedLeaves = computed(
    () => this.leaves().filter((leave) => leave.status === 'APPROVED').length,
  );

  rejectedLeaves = computed(
    () => this.leaves().filter((leave) => leave.status === 'REJECTED').length,
  );

  totalLeaveDays = computed(() =>
    this.leaves().reduce(
      (total, leave) => total + Number(leave.totalDays || 0),
      0,
    ),
  );

  filteredStaffs = computed(() => {
    const keyword = this.staffSearchTerm().trim().toLowerCase();

    const activeStaffs = this.staffs().filter(
      (staff) => staff.status === 'ACTIVE',
    );

    if (!keyword) {
      return activeStaffs.slice(0, 8);
    }

    return activeStaffs
      .filter((staff) => {
        const searchableText = [
          staff.staffCode,
          staff.fullName,
          staff.email,
          staff.phone,
          staff.departmentCode,
          staff.departmentName,
          staff.designationCode,
          staff.designation,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(keyword);
      })
      .slice(0, 8);
  });

  constructor(
    private readonly leavesService: LeavesService,
    private readonly staffsService: StaffsService,
  ) {}

  ngOnInit(): void {
    this.loadLeaves();
    this.loadStaffs();
  }

  loadLeaves(search = this.searchTerm()): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.leavesService.getLeaves(search).subscribe({
      next: (leaves) => {
        this.leaves.set(leaves);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.serverError.set(
          error?.error?.message || 'Failed to load leave records.',
        );
        this.isLoading.set(false);
        this.showToast('Failed to load leave records.', 'error');
      },
    });
  }

  loadStaffs(): void {
    this.staffsService.getStaffs().subscribe({
      next: (staffs) => {
        this.staffs.set(staffs);
      },
      error: () => {
        this.showToast('Staff suggestions could not load.', 'error');
      },
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.loadLeaves(value);
  }

  onStaffInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.staffSearchTerm.set(value);
    this.showStaffSuggestions.set(true);

    if (!value.trim()) {
      this.clearStaffSelection();
    }
  }

  onStaffFocus(): void {
    const value = this.leaveForm.controls.staffName.value;
    this.staffSearchTerm.set(value);
    this.showStaffSuggestions.set(true);
  }

  onStaffBlur(): void {
    setTimeout(() => {
      this.showStaffSuggestions.set(false);
    }, 160);
  }

  selectStaff(staff: Staff): void {
    this.leaveForm.controls.staffCode.setValue(staff.staffCode);
    this.leaveForm.controls.staffName.setValue(staff.fullName);
    this.leaveForm.controls.departmentCode.setValue(staff.departmentCode || '');
    this.leaveForm.controls.departmentName.setValue(staff.departmentName || '');
    this.leaveForm.controls.designationCode.setValue(
      staff.designationCode || '',
    );
    this.leaveForm.controls.designation.setValue(staff.designation || '');

    this.staffSearchTerm.set(`${staff.staffCode} - ${staff.fullName}`);
    this.showStaffSuggestions.set(false);
  }

  clearStaffSelection(): void {
    this.leaveForm.controls.staffCode.setValue('');
    this.leaveForm.controls.staffName.setValue('');
    this.leaveForm.controls.departmentCode.setValue('');
    this.leaveForm.controls.departmentName.setValue('');
    this.leaveForm.controls.designationCode.setValue('');
    this.leaveForm.controls.designation.setValue('');
    this.staffSearchTerm.set('');
    this.showStaffSuggestions.set(false);
  }

  openCreateModal(): void {
    this.selectedLeave.set(null);

    this.leaveForm.reset({
      leaveCode: '',
      staffCode: '',
      staffName: '',
      departmentCode: '',
      departmentName: '',
      designationCode: '',
      designation: '',
      leaveType: 'SICK',
      startDate: '',
      endDate: '',
      reason: '',
      status: 'PENDING',
      approvedBy: '',
      remarks: '',
    });

    this.leavesService.generateNextLeaveCode().subscribe({
      next: (leaveCode) => {
        this.leaveForm.controls.leaveCode.setValue(leaveCode);
      },
      error: () => {
        this.leaveForm.controls.leaveCode.setValue('LEV-0001');
        this.showToast('Could not generate next leave ID.', 'error');
      },
    });

    this.resetSuggestionState();
    this.serverError.set('');
    this.showLeaveModal.set(true);
  }

  openEditModal(leave: StaffLeave): void {
    this.selectedLeave.set(leave);

    this.leaveForm.reset({
      leaveCode: leave.leaveCode,
      staffCode: leave.staffCode || '',
      staffName: leave.staffName,
      departmentCode: leave.departmentCode || '',
      departmentName: leave.departmentName || '',
      designationCode: leave.designationCode || '',
      designation: leave.designation || '',
      leaveType: leave.leaveType,
      startDate: this.formatDateForInput(leave.startDate),
      endDate: this.formatDateForInput(leave.endDate),
      reason: leave.reason,
      status: leave.status,
      approvedBy: leave.approvedBy || '',
      remarks: leave.remarks || '',
    });

    this.staffSearchTerm.set(
      leave.staffCode
        ? `${leave.staffCode} - ${leave.staffName}`
        : leave.staffName,
    );

    this.showStaffSuggestions.set(false);
    this.serverError.set('');
    this.showLeaveModal.set(true);
  }

  closeLeaveModal(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.showLeaveModal.set(false);
    this.selectedLeave.set(null);
    this.resetSuggestionState();
    this.serverError.set('');
  }

  saveLeave(): void {
    this.leaveForm.markAllAsTouched();
    this.serverError.set('');

    if (this.leaveForm.invalid || this.isSubmitting()) {
      return;
    }

    if (!this.isDateRangeValid()) {
      this.serverError.set('End date cannot be before start date.');
      return;
    }

    const selectedLeave = this.selectedLeave();
    const payload = this.buildLeavePayload();

    this.isSubmitting.set(true);

    if (selectedLeave) {
      this.leavesService.updateLeave(selectedLeave.id, payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeLeaveModal();
          this.loadLeaves();
          this.showToast('Leave record updated successfully.', 'success');
        },
        error: (error) => {
          this.isSubmitting.set(false);
          this.serverError.set(
            error?.error?.message || 'Failed to update leave record.',
          );
          this.showToast('Failed to update leave record.', 'error');
        },
      });

      return;
    }

    this.leavesService.createLeave(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeLeaveModal();
        this.loadLeaves();
        this.showToast('Leave record added successfully.', 'success');
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.serverError.set(
          error?.error?.message || 'Failed to create leave record.',
        );
        this.showToast('Failed to create leave record.', 'error');
      },
    });
  }

  openDeleteModal(leave: StaffLeave): void {
    this.leaveToDelete.set(leave);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.leaveToDelete.set(null);
  }

  confirmDeleteLeave(): void {
    const leave = this.leaveToDelete();

    if (!leave || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);

    this.leavesService.deleteLeave(leave.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.leaveToDelete.set(null);
        this.loadLeaves();
        this.showToast('Leave record deleted successfully.', 'success');
      },
      error: (error) => {
        this.isDeleting.set(false);
        this.leaveToDelete.set(null);
        this.serverError.set(
          error?.error?.message || 'Failed to delete leave record.',
        );
        this.showToast('Failed to delete leave record.', 'error');
      },
    });
  }

  getStaffInitial(staff: Staff): string {
    return staff.fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }

  getLeaveInitial(leave: StaffLeave): string {
    return leave.staffName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }

  getLeaveTypeLabel(type: LeaveType): string {
    return type.charAt(0) + type.slice(1).toLowerCase();
  }

  getStatusLabel(status: LeaveStatus): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  getCurrentTotalDays(): number {
    const startDate = this.leaveForm.controls.startDate.value;
    const endDate = this.leaveForm.controls.endDate.value;

    if (!startDate || !endDate || !this.isDateRangeValid()) {
      return 0;
    }

    return this.calculateTotalDays(startDate, endDate);
  }

  formatDisplayDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  }

  isInvalid(controlName: keyof typeof this.leaveForm.controls): boolean {
    const control = this.leaveForm.controls[controlName];
    return control.invalid && control.touched;
  }

  isDateRangeValid(): boolean {
    const startDate = this.leaveForm.controls.startDate.value;
    const endDate = this.leaveForm.controls.endDate.value;

    if (!startDate || !endDate) {
      return true;
    }

    return new Date(endDate) >= new Date(startDate);
  }

  private buildLeavePayload(): CreateLeavePayload {
    const formValue = this.leaveForm.getRawValue();

    const payload: CreateLeavePayload = {
      leaveCode: formValue.leaveCode.trim(),
      staffName: formValue.staffName.trim(),
      leaveType: formValue.leaveType,
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      reason: formValue.reason.trim(),
      status: formValue.status,
    };

    if (formValue.staffCode.trim()) {
      payload.staffCode = formValue.staffCode.trim();
    }

    if (formValue.departmentCode.trim()) {
      payload.departmentCode = formValue.departmentCode.trim();
    }

    if (formValue.departmentName.trim()) {
      payload.departmentName = formValue.departmentName.trim();
    }

    if (formValue.designationCode.trim()) {
      payload.designationCode = formValue.designationCode.trim();
    }

    if (formValue.designation.trim()) {
      payload.designation = formValue.designation.trim();
    }

    if (formValue.approvedBy.trim()) {
      payload.approvedBy = formValue.approvedBy.trim();
    }

    if (formValue.remarks.trim()) {
      payload.remarks = formValue.remarks.trim();
    }

    return payload;
  }

  private calculateTotalDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const difference = end.getTime() - start.getTime();
    const days = Math.floor(difference / (1000 * 60 * 60 * 24)) + 1;

    return Math.max(days, 1);
  }

  private formatDateForInput(date: string): string {
    if (!date) {
      return '';
    }

    return new Date(date).toISOString().split('T')[0];
  }

  private resetSuggestionState(): void {
    this.staffSearchTerm.set('');
    this.showStaffSuggestions.set(false);
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
