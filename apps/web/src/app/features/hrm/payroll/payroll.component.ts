import { Component, OnInit, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  CreatePayrollPayload,
  Payroll,
  PayrollStatus,
} from '../../../core/models/payroll.model';
import { Staff } from '../../../core/models/staff.model';
import { PayrollService } from '../../../core/services/payroll.service';
import { StaffsService } from '../../../core/services/staffs.service';

type ToastType = 'success' | 'error';

type StaffOption = Staff & {
  staffCode?: string | null;
  staffId?: string | null;
  staffNo?: string | null;
  employeeNo?: string | null;
  fullName?: string | null;
  name?: string | null;
  department?: string | null;
  departmentName?: string | null;
  designation?: string | null;
  designationName?: string | null;
  designationCode?: string | null;
  status?: string | null;
  salary?: number | string | null;
};

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './payroll.component.html',
  styleUrl: './payroll.component.scss',
})
export class PayrollComponent implements OnInit {
  payrollRecords = signal<Payroll[]>([]);
  staffs = signal<Staff[]>([]);

  selectedPayroll = signal<Payroll | null>(null);
  payrollToDelete = signal<Payroll | null>(null);

  isLoading = signal(false);
  isSubmitting = signal(false);
  isDeleting = signal(false);
  showPayrollModal = signal(false);

  serverError = signal('');
  searchTerm = signal('');

  showStaffSuggestions = signal(false);
  staffSearchTerm = signal('');

  toast = signal<{ message: string; type: ToastType } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  isEditMode = computed(() => this.selectedPayroll() !== null);

  totalPayrolls = computed(() => this.payrollRecords().length);

  pendingCount = computed(
    () =>
      this.payrollRecords().filter((record) => record.status === 'PENDING')
        .length,
  );

  paidCount = computed(
    () =>
      this.payrollRecords().filter((record) => record.status === 'PAID').length,
  );

  failedCount = computed(
    () =>
      this.payrollRecords().filter((record) => record.status === 'FAILED')
        .length,
  );

  totalNetSalary = computed(() =>
    this.payrollRecords().reduce(
      (total, record) => total + Number(record.netSalary || 0),
      0,
    ),
  );

  filteredStaffs = computed(() => {
    const keyword = this.staffSearchTerm().trim().toLowerCase();

    const activeStaffs = this.staffs()
      .map((staff) => staff as StaffOption)
      .filter((staff) => this.getStaffStatus(staff) === 'ACTIVE');

    if (!keyword) {
      return activeStaffs.slice(0, 8);
    }

    return activeStaffs
      .filter((staff) => {
        const searchableText = [
          this.getStaffCode(staff),
          this.getStaffName(staff),
          this.getStaffDepartment(staff),
          this.getStaffDesignation(staff),
          staff.designationCode,
          staff.salary,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(keyword);
      })
      .slice(0, 8);
  });

  payrollForm = new FormGroup({
    payrollCode: new FormControl('', {
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
    department: new FormControl('', {
      nonNullable: true,
    }),
    designation: new FormControl('', {
      nonNullable: true,
    }),
    salaryMonth: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    basicSalary: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    allowance: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.min(0)],
    }),
    deduction: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.min(0)],
    }),
    status: new FormControl<PayrollStatus>('PENDING', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    paymentDate: new FormControl('', {
      nonNullable: true,
    }),
    remarks: new FormControl('', {
      nonNullable: true,
    }),
  });

  constructor(
    private readonly payrollService: PayrollService,
    private readonly staffsService: StaffsService,
  ) {}

  ngOnInit(): void {
    this.loadPayrollRecords();
    this.loadStaffs();
  }

  loadPayrollRecords(search = this.searchTerm()): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.payrollService.getPayrollRecords(search).subscribe({
      next: (records) => {
        this.payrollRecords.set(records);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.serverError.set(
          error?.error?.message || 'Failed to load payroll records.',
        );
        this.isLoading.set(false);
        this.showToast('Failed to load payroll records.', 'error');
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
    this.loadPayrollRecords(value);
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
    const value = this.payrollForm.controls.staffName.value;
    this.staffSearchTerm.set(value);
    this.showStaffSuggestions.set(true);
  }

  onStaffBlur(): void {
    setTimeout(() => {
      this.showStaffSuggestions.set(false);
    }, 160);
  }

  selectStaff(staff: StaffOption): void {
    const staffCode = this.getStaffCode(staff);
    const staffName = this.getStaffName(staff);
    const department = this.getStaffDepartment(staff);
    const designation = this.getStaffDesignation(staff);
    const salary = this.getStaffSalary(staff);

    this.payrollForm.controls.staffCode.setValue(
      staffCode === 'Not added' ? '' : staffCode,
    );
    this.payrollForm.controls.staffName.setValue(staffName);
    this.payrollForm.controls.department.setValue(
      department === 'Not added' ? '' : department,
    );
    this.payrollForm.controls.designation.setValue(
      designation === 'Not added' ? '' : designation,
    );

    if (salary > 0) {
      this.payrollForm.controls.basicSalary.setValue(salary);
    }

    this.staffSearchTerm.set(`${staffCode} - ${staffName}`);
    this.showStaffSuggestions.set(false);
  }

  clearStaffSelection(): void {
    this.payrollForm.controls.staffCode.setValue('');
    this.payrollForm.controls.staffName.setValue('');
    this.payrollForm.controls.department.setValue('');
    this.payrollForm.controls.designation.setValue('');
    this.staffSearchTerm.set('');
    this.showStaffSuggestions.set(false);
  }

  openCreateModal(): void {
    this.selectedPayroll.set(null);

    this.payrollForm.reset({
      payrollCode: '',
      staffCode: '',
      staffName: '',
      department: '',
      designation: '',
      salaryMonth: this.getCurrentMonthForInput(),
      basicSalary: 0,
      allowance: 0,
      deduction: 0,
      status: 'PENDING',
      paymentDate: '',
      remarks: '',
    });

    this.payrollService.generateNextPayrollCode().subscribe({
      next: (payrollCode) => {
        this.payrollForm.controls.payrollCode.setValue(payrollCode);
      },
      error: () => {
        this.payrollForm.controls.payrollCode.setValue('PAY-0001');
        this.showToast('Could not generate next payroll ID.', 'error');
      },
    });

    this.resetSuggestionState();
    this.serverError.set('');
    this.showPayrollModal.set(true);
  }

  openEditModal(payroll: Payroll): void {
    this.selectedPayroll.set(payroll);

    this.payrollForm.reset({
      payrollCode: payroll.payrollCode,
      staffCode: payroll.staffCode || '',
      staffName: payroll.staffName,
      department: payroll.department || '',
      designation: payroll.designation || '',
      salaryMonth: payroll.salaryMonth,
      basicSalary: Number(payroll.basicSalary || 0),
      allowance: Number(payroll.allowance || 0),
      deduction: Number(payroll.deduction || 0),
      status: payroll.status,
      paymentDate: payroll.paymentDate
        ? this.formatDateForInput(payroll.paymentDate)
        : '',
      remarks: payroll.remarks || '',
    });

    this.staffSearchTerm.set(
      payroll.staffCode
        ? `${payroll.staffCode} - ${payroll.staffName}`
        : payroll.staffName,
    );

    this.showStaffSuggestions.set(false);
    this.serverError.set('');
    this.showPayrollModal.set(true);
  }

  closePayrollModal(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.showPayrollModal.set(false);
    this.selectedPayroll.set(null);
    this.resetSuggestionState();
    this.serverError.set('');
  }

  savePayroll(): void {
    this.payrollForm.markAllAsTouched();
    this.serverError.set('');

    if (this.payrollForm.invalid || this.isSubmitting()) {
      return;
    }

    const selectedPayroll = this.selectedPayroll();
    const payload = this.buildPayrollPayload();

    this.isSubmitting.set(true);

    if (selectedPayroll) {
      this.payrollService
        .updatePayrollRecord(selectedPayroll.id, payload)
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.closePayrollModal();
            this.loadPayrollRecords();
            this.showToast('Payroll record updated successfully.', 'success');
          },
          error: (error) => {
            this.isSubmitting.set(false);
            this.serverError.set(
              error?.error?.message || 'Failed to update payroll record.',
            );
            this.showToast('Failed to update payroll record.', 'error');
          },
        });

      return;
    }

    this.payrollService.createPayrollRecord(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closePayrollModal();
        this.loadPayrollRecords();
        this.showToast('Payroll record added successfully.', 'success');
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.serverError.set(
          error?.error?.message || 'Failed to create payroll record.',
        );
        this.showToast('Failed to create payroll record.', 'error');
      },
    });
  }

  openDeleteModal(payroll: Payroll): void {
    this.payrollToDelete.set(payroll);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.payrollToDelete.set(null);
  }

  confirmDeletePayroll(): void {
    const payroll = this.payrollToDelete();

    if (!payroll || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);

    this.payrollService.deletePayrollRecord(payroll.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.payrollToDelete.set(null);
        this.loadPayrollRecords();
        this.showToast('Payroll record deleted successfully.', 'success');
      },
      error: (error) => {
        this.isDeleting.set(false);
        this.payrollToDelete.set(null);
        this.serverError.set(
          error?.error?.message || 'Failed to delete payroll record.',
        );
        this.showToast('Failed to delete payroll record.', 'error');
      },
    });
  }

  calculateNetSalaryPreview(): number {
    const basicSalary = Number(
      this.payrollForm.controls.basicSalary.value || 0,
    );
    const allowance = Number(this.payrollForm.controls.allowance.value || 0);
    const deduction = Number(this.payrollForm.controls.deduction.value || 0);
    const netSalary = basicSalary + allowance - deduction;

    return netSalary < 0 ? 0 : netSalary;
  }

  getStaffInitial(staff: StaffOption): string {
    return this.getStaffName(staff)
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }

  getPayrollInitial(payroll: Payroll): string {
    return payroll.staffName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }

  getStatusLabel(status: PayrollStatus): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  formatCurrency(value: number): string {
    return `Rs. ${Number(value || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  formatDisplayDate(date?: string | null): string {
    if (!date) {
      return 'Not paid';
    }

    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  }

  isInvalid(controlName: keyof typeof this.payrollForm.controls): boolean {
    const control = this.payrollForm.controls[controlName];
    return control.invalid && control.touched;
  }

  private buildPayrollPayload(): CreatePayrollPayload {
    const formValue = this.payrollForm.getRawValue();

    const payload: CreatePayrollPayload = {
      payrollCode: formValue.payrollCode.trim(),
      staffName: formValue.staffName.trim(),
      salaryMonth: formValue.salaryMonth.trim(),
      basicSalary: Number(formValue.basicSalary || 0),
      allowance: Number(formValue.allowance || 0),
      deduction: Number(formValue.deduction || 0),
      status: formValue.status,
    };

    if (formValue.staffCode.trim()) {
      payload.staffCode = formValue.staffCode.trim();
    }

    if (formValue.department.trim()) {
      payload.department = formValue.department.trim();
    }

    if (formValue.designation.trim()) {
      payload.designation = formValue.designation.trim();
    }

    if (formValue.paymentDate.trim()) {
      payload.paymentDate = formValue.paymentDate.trim();
    }

    if (formValue.remarks.trim()) {
      payload.remarks = formValue.remarks.trim();
    }

    return payload;
  }

  private getStaffCode(staff: StaffOption): string {
    return (
      staff.staffCode ||
      staff.staffId ||
      staff.staffNo ||
      staff.employeeNo ||
      'Not added'
    );
  }

  private getStaffName(staff: StaffOption): string {
    return staff.fullName || staff.name || 'Unknown Staff';
  }

  private getStaffDepartment(staff: StaffOption): string {
    return staff.department || staff.departmentName || 'Not added';
  }

  private getStaffDesignation(staff: StaffOption): string {
    return staff.designation || staff.designationName || 'Not added';
  }

  private getStaffSalary(staff: StaffOption): number {
    const salary = Number(staff.salary || 0);
    return Number.isFinite(salary) ? salary : 0;
  }

  private getStaffStatus(staff: StaffOption): 'ACTIVE' | 'INACTIVE' {
    return String(staff.status || 'ACTIVE').toUpperCase() === 'INACTIVE'
      ? 'INACTIVE'
      : 'ACTIVE';
  }

  private getCurrentMonthForInput(): string {
    const today = new Date();

    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      '0',
    )}`;
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
