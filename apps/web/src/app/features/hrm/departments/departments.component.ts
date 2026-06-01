import { Component, OnInit, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  CreateDepartmentPayload,
  Department,
  DepartmentStatus,
} from '../../../core/models/department.model';
import { DepartmentsService } from '../../../core/services/departments.service';

type ToastType = 'success' | 'error';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './departments.component.html',
  styleUrl: './departments.component.scss',
})
export class DepartmentsComponent implements OnInit {
  departments = signal<Department[]>([]);
  selectedDepartment = signal<Department | null>(null);
  departmentToDelete = signal<Department | null>(null);

  isLoading = signal(false);
  isSubmitting = signal(false);
  isDeleting = signal(false);
  showDepartmentModal = signal(false);

  serverError = signal('');
  searchTerm = signal('');

  toast = signal<{ message: string; type: ToastType } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  isEditMode = computed(() => this.selectedDepartment() !== null);

  activeDepartments = computed(
    () =>
      this.departments().filter((department) => department.status === 'ACTIVE')
        .length,
  );

  inactiveDepartments = computed(
    () =>
      this.departments().filter(
        (department) => department.status === 'INACTIVE',
      ).length,
  );

  headedDepartments = computed(
    () =>
      this.departments().filter((department) =>
        Boolean(department.headOfDepartment),
      ).length,
  );

  locationsUsed = computed(() => {
    const locations = this.departments()
      .map((department) => department.location)
      .filter(Boolean);

    return new Set(locations).size;
  });

  departmentForm = new FormGroup({
    departmentCode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    departmentName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    headOfDepartment: new FormControl('', {
      nonNullable: true,
    }),
    phone: new FormControl('', {
      nonNullable: true,
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.email],
    }),
    location: new FormControl('', {
      nonNullable: true,
    }),
    description: new FormControl('', {
      nonNullable: true,
    }),
    status: new FormControl<DepartmentStatus>('ACTIVE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor(private readonly departmentsService: DepartmentsService) {}

  ngOnInit(): void {
    this.loadDepartments();
  }

  loadDepartments(search = this.searchTerm()): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.departmentsService.getDepartments(search).subscribe({
      next: (departments) => {
        this.departments.set(departments);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.serverError.set(
          error?.error?.message || 'Failed to load departments.',
        );
        this.isLoading.set(false);
        this.showToast('Failed to load departments.', 'error');
      },
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.loadDepartments(value);
  }

  openCreateModal(): void {
    this.selectedDepartment.set(null);

    this.departmentForm.reset({
      departmentCode: '',
      departmentName: '',
      headOfDepartment: '',
      phone: '',
      email: '',
      location: '',
      description: '',
      status: 'ACTIVE',
    });

    this.departmentsService.generateNextDepartmentCode().subscribe({
      next: (departmentCode) => {
        this.departmentForm.controls.departmentCode.setValue(departmentCode);
      },
      error: () => {
        this.departmentForm.controls.departmentCode.setValue('DPT-0001');
        this.showToast('Could not generate next department ID.', 'error');
      },
    });

    this.serverError.set('');
    this.showDepartmentModal.set(true);
  }

  openEditModal(department: Department): void {
    this.selectedDepartment.set(department);

    this.departmentForm.reset({
      departmentCode: department.departmentCode,
      departmentName: department.departmentName,
      headOfDepartment: department.headOfDepartment || '',
      phone: department.phone || '',
      email: department.email || '',
      location: department.location || '',
      description: department.description || '',
      status: department.status,
    });

    this.serverError.set('');
    this.showDepartmentModal.set(true);
  }

  closeDepartmentModal(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.showDepartmentModal.set(false);
    this.selectedDepartment.set(null);
    this.serverError.set('');
  }

  saveDepartment(): void {
    this.departmentForm.markAllAsTouched();
    this.serverError.set('');

    if (this.departmentForm.invalid || this.isSubmitting()) {
      return;
    }

    const selectedDepartment = this.selectedDepartment();
    const payload = this.buildDepartmentPayload();

    this.isSubmitting.set(true);

    if (selectedDepartment) {
      this.departmentsService
        .updateDepartment(selectedDepartment.id, payload)
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.closeDepartmentModal();
            this.loadDepartments();
            this.showToast('Department updated successfully.', 'success');
          },
          error: (error) => {
            this.isSubmitting.set(false);
            this.serverError.set(
              error?.error?.message || 'Failed to update department.',
            );
            this.showToast('Failed to update department.', 'error');
          },
        });

      return;
    }

    this.departmentsService.createDepartment(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeDepartmentModal();
        this.loadDepartments();
        this.showToast('Department added successfully.', 'success');
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.serverError.set(
          error?.error?.message || 'Failed to create department.',
        );
        this.showToast('Failed to create department.', 'error');
      },
    });
  }

  openDeleteModal(department: Department): void {
    this.departmentToDelete.set(department);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.departmentToDelete.set(null);
  }

  confirmDeleteDepartment(): void {
    const department = this.departmentToDelete();

    if (!department || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);

    this.departmentsService.deleteDepartment(department.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.departmentToDelete.set(null);
        this.loadDepartments();
        this.showToast('Department deleted successfully.', 'success');
      },
      error: (error) => {
        this.isDeleting.set(false);
        this.departmentToDelete.set(null);
        this.serverError.set(
          error?.error?.message || 'Failed to delete department.',
        );
        this.showToast('Failed to delete department.', 'error');
      },
    });
  }

  getInitials(department: Department): string {
    return department.departmentName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }

  getStatusLabel(status: DepartmentStatus): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  isInvalid(controlName: keyof typeof this.departmentForm.controls): boolean {
    const control = this.departmentForm.controls[controlName];
    return control.invalid && control.touched;
  }

  private buildDepartmentPayload(): CreateDepartmentPayload {
    const formValue = this.departmentForm.getRawValue();

    const payload: CreateDepartmentPayload = {
      departmentCode: formValue.departmentCode.trim(),
      departmentName: formValue.departmentName.trim(),
      status: formValue.status,
    };

    if (formValue.headOfDepartment.trim()) {
      payload.headOfDepartment = formValue.headOfDepartment.trim();
    }

    if (formValue.phone.trim()) {
      payload.phone = formValue.phone.trim();
    }

    if (formValue.email.trim()) {
      payload.email = formValue.email.trim();
    }

    if (formValue.location.trim()) {
      payload.location = formValue.location.trim();
    }

    if (formValue.description.trim()) {
      payload.description = formValue.description.trim();
    }

    return payload;
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
