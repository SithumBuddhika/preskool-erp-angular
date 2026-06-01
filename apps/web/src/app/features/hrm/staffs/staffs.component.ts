import { Component, OnInit, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Department } from '../../../core/models/department.model';
import {
  CreateStaffPayload,
  Staff,
  StaffEmploymentType,
  StaffGender,
  StaffStatus,
} from '../../../core/models/staff.model';
import { DepartmentsService } from '../../../core/services/departments.service';
import { StaffsService } from '../../../core/services/staffs.service';

type ToastType = 'success' | 'error';

@Component({
  selector: 'app-staffs',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './staffs.component.html',
  styleUrl: './staffs.component.scss',
})
export class StaffsComponent implements OnInit {
  staffs = signal<Staff[]>([]);
  departments = signal<Department[]>([]);

  selectedStaff = signal<Staff | null>(null);
  staffToDelete = signal<Staff | null>(null);

  isLoading = signal(false);
  isSubmitting = signal(false);
  isDeleting = signal(false);
  showStaffModal = signal(false);

  serverError = signal('');
  searchTerm = signal('');

  showDepartmentSuggestions = signal(false);
  departmentSearchTerm = signal('');

  toast = signal<{ message: string; type: ToastType } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  isEditMode = computed(() => this.selectedStaff() !== null);

  activeStaffs = computed(
    () => this.staffs().filter((staff) => staff.status === 'ACTIVE').length,
  );

  inactiveStaffs = computed(
    () => this.staffs().filter((staff) => staff.status === 'INACTIVE').length,
  );

  totalDepartmentsUsed = computed(() => {
    const departments = this.staffs()
      .map((staff) => staff.departmentName)
      .filter(Boolean);

    return new Set(departments).size;
  });

  fullTimeStaffs = computed(
    () =>
      this.staffs().filter((staff) => staff.employmentType === 'FULL_TIME')
        .length,
  );

  filteredDepartments = computed(() => {
    const keyword = this.departmentSearchTerm().trim().toLowerCase();

    const activeDepartments = this.departments().filter(
      (department) => department.status !== 'INACTIVE',
    );

    if (!keyword) {
      return activeDepartments.slice(0, 6);
    }

    return activeDepartments
      .filter((department) => {
        const searchableText = [
          department.departmentCode,
          department.departmentName,
          department.headOfDepartment,
          department.email,
          department.phone,
          department.location,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(keyword);
      })
      .slice(0, 6);
  });

  staffForm = new FormGroup({
    staffCode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    fullName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    gender: new FormControl<StaffGender>('MALE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    departmentCode: new FormControl('', {
      nonNullable: true,
    }),
    departmentName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    designation: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    employmentType: new FormControl<StaffEmploymentType>('FULL_TIME', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    joiningDate: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    salary: new FormControl('', {
      nonNullable: true,
    }),
    address: new FormControl('', {
      nonNullable: true,
    }),
    status: new FormControl<StaffStatus>('ACTIVE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor(
    private readonly staffsService: StaffsService,
    private readonly departmentsService: DepartmentsService,
  ) {}

  ngOnInit(): void {
    this.loadStaffs();
    this.loadDepartments();
  }

  loadStaffs(search = this.searchTerm()): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.staffsService.getStaffs(search).subscribe({
      next: (staffs) => {
        this.staffs.set(staffs);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.serverError.set(error?.error?.message || 'Failed to load staffs.');
        this.isLoading.set(false);
        this.showToast('Failed to load staffs.', 'error');
      },
    });
  }

  loadDepartments(): void {
    this.departmentsService.getDepartments().subscribe({
      next: (departments) => {
        this.departments.set(departments);
      },
      error: () => {
        this.showToast('Department suggestions could not load.', 'error');
      },
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.loadStaffs(value);
  }

  onDepartmentInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.departmentSearchTerm.set(value);
    this.showDepartmentSuggestions.set(true);

    if (!value.trim()) {
      this.staffForm.controls.departmentCode.setValue('');
    }
  }

  onDepartmentFocus(): void {
    const value = this.staffForm.controls.departmentName.value;
    this.departmentSearchTerm.set(value);
    this.showDepartmentSuggestions.set(true);
  }

  onDepartmentBlur(): void {
    setTimeout(() => {
      this.showDepartmentSuggestions.set(false);
    }, 160);
  }

  selectDepartment(department: Department): void {
    this.staffForm.controls.departmentCode.setValue(department.departmentCode);
    this.staffForm.controls.departmentName.setValue(department.departmentName);
    this.departmentSearchTerm.set(department.departmentName);
    this.showDepartmentSuggestions.set(false);
  }

  openCreateModal(): void {
    this.selectedStaff.set(null);

    this.staffForm.reset({
      staffCode: '',
      fullName: '',
      email: '',
      phone: '',
      gender: 'MALE',
      departmentCode: '',
      departmentName: '',
      designation: '',
      employmentType: 'FULL_TIME',
      joiningDate: '',
      salary: '',
      address: '',
      status: 'ACTIVE',
    });

    this.staffsService.generateNextStaffCode().subscribe({
      next: (staffCode) => {
        this.staffForm.controls.staffCode.setValue(staffCode);
      },
      error: () => {
        this.staffForm.controls.staffCode.setValue('STF-0001');
        this.showToast('Could not generate next staff ID.', 'error');
      },
    });

    this.resetSuggestionState();
    this.serverError.set('');
    this.showStaffModal.set(true);
  }

  openEditModal(staff: Staff): void {
    this.selectedStaff.set(staff);

    this.staffForm.reset({
      staffCode: staff.staffCode,
      fullName: staff.fullName,
      email: staff.email,
      phone: staff.phone,
      gender: staff.gender,
      departmentCode: staff.departmentCode || '',
      departmentName: staff.departmentName,
      designation: staff.designation,
      employmentType: staff.employmentType,
      joiningDate: this.formatDateForInput(staff.joiningDate),
      salary:
        staff.salary !== null && staff.salary !== undefined
          ? String(staff.salary)
          : '',
      address: staff.address || '',
      status: staff.status,
    });

    this.departmentSearchTerm.set(staff.departmentName);
    this.showDepartmentSuggestions.set(false);

    this.serverError.set('');
    this.showStaffModal.set(true);
  }

  closeStaffModal(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.showStaffModal.set(false);
    this.selectedStaff.set(null);
    this.resetSuggestionState();
    this.serverError.set('');
  }

  saveStaff(): void {
    this.staffForm.markAllAsTouched();
    this.serverError.set('');

    if (this.staffForm.invalid || this.isSubmitting()) {
      return;
    }

    const selectedStaff = this.selectedStaff();
    const payload = this.buildStaffPayload();

    this.isSubmitting.set(true);

    if (selectedStaff) {
      this.staffsService.updateStaff(selectedStaff.id, payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeStaffModal();
          this.loadStaffs();
          this.showToast('Staff updated successfully.', 'success');
        },
        error: (error) => {
          this.isSubmitting.set(false);
          this.serverError.set(
            error?.error?.message || 'Failed to update staff.',
          );
          this.showToast('Failed to update staff.', 'error');
        },
      });

      return;
    }

    this.staffsService.createStaff(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeStaffModal();
        this.loadStaffs();
        this.showToast('Staff added successfully.', 'success');
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.serverError.set(
          error?.error?.message || 'Failed to create staff.',
        );
        this.showToast('Failed to create staff.', 'error');
      },
    });
  }

  openDeleteModal(staff: Staff): void {
    this.staffToDelete.set(staff);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.staffToDelete.set(null);
  }

  confirmDeleteStaff(): void {
    const staff = this.staffToDelete();

    if (!staff || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);

    this.staffsService.deleteStaff(staff.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.staffToDelete.set(null);
        this.loadStaffs();
        this.showToast('Staff deleted successfully.', 'success');
      },
      error: (error) => {
        this.isDeleting.set(false);
        this.staffToDelete.set(null);
        this.serverError.set(
          error?.error?.message || 'Failed to delete staff.',
        );
        this.showToast('Failed to delete staff.', 'error');
      },
    });
  }

  getInitials(staff: Staff): string {
    return staff.fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((name) => name[0])
      .join('')
      .toUpperCase();
  }

  getDepartmentInitial(department: Department): string {
    return department.departmentName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }

  getGenderLabel(gender: StaffGender): string {
    return gender.charAt(0) + gender.slice(1).toLowerCase();
  }

  getEmploymentTypeLabel(type: StaffEmploymentType): string {
    return type
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  getStatusLabel(status: StaffStatus): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  formatDisplayDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  }

  formatSalary(salary?: number | null): string {
    if (salary === null || salary === undefined) {
      return 'Not added';
    }

    return `Rs. ${salary.toLocaleString()}`;
  }

  isInvalid(controlName: keyof typeof this.staffForm.controls): boolean {
    const control = this.staffForm.controls[controlName];
    return control.invalid && control.touched;
  }

  private buildStaffPayload(): CreateStaffPayload {
    const formValue = this.staffForm.getRawValue();

    const payload: CreateStaffPayload = {
      staffCode: formValue.staffCode.trim(),
      fullName: formValue.fullName.trim(),
      email: formValue.email.trim(),
      phone: formValue.phone.trim(),
      gender: formValue.gender,
      departmentName: formValue.departmentName.trim(),
      designation: formValue.designation.trim(),
      employmentType: formValue.employmentType,
      joiningDate: formValue.joiningDate,
      status: formValue.status,
    };

    if (formValue.departmentCode.trim()) {
      payload.departmentCode = formValue.departmentCode.trim();
    }

    if (formValue.salary.trim()) {
      payload.salary = Number(formValue.salary);
    }

    if (formValue.address.trim()) {
      payload.address = formValue.address.trim();
    }

    return payload;
  }

  private formatDateForInput(date: string): string {
    if (!date) {
      return '';
    }

    return new Date(date).toISOString().split('T')[0];
  }

  private resetSuggestionState(): void {
    this.departmentSearchTerm.set('');
    this.showDepartmentSuggestions.set(false);
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
