import { Component, OnInit, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Department } from '../../../core/models/department.model';
import {
  CreateDesignationPayload,
  Designation,
  DesignationStatus,
} from '../../../core/models/designation.model';
import { DepartmentsService } from '../../../core/services/departments.service';
import { DesignationsService } from '../../../core/services/designations.service';

type ToastType = 'success' | 'error';

@Component({
  selector: 'app-designations',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './designations.component.html',
  styleUrl: './designations.component.scss',
})
export class DesignationsComponent implements OnInit {
  designations = signal<Designation[]>([]);
  departments = signal<Department[]>([]);

  selectedDesignation = signal<Designation | null>(null);
  designationToDelete = signal<Designation | null>(null);

  isLoading = signal(false);
  isSubmitting = signal(false);
  isDeleting = signal(false);
  showDesignationModal = signal(false);

  serverError = signal('');
  searchTerm = signal('');

  showDepartmentSuggestions = signal(false);
  departmentSearchTerm = signal('');

  toast = signal<{ message: string; type: ToastType } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  isEditMode = computed(() => this.selectedDesignation() !== null);

  activeDesignations = computed(
    () =>
      this.designations().filter(
        (designation) => designation.status === 'ACTIVE',
      ).length,
  );

  inactiveDesignations = computed(
    () =>
      this.designations().filter(
        (designation) => designation.status === 'INACTIVE',
      ).length,
  );

  departmentSpecificDesignations = computed(
    () =>
      this.designations().filter((designation) =>
        Boolean(designation.departmentName),
      ).length,
  );

  commonDesignations = computed(
    () =>
      this.designations().filter((designation) => !designation.departmentName)
        .length,
  );

  filteredDepartments = computed(() => {
    const keyword = this.departmentSearchTerm().trim().toLowerCase();

    const activeDepartments = this.departments().filter(
      (department) => department.status === 'ACTIVE',
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

  designationForm = new FormGroup({
    designationCode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    designationName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    departmentCode: new FormControl('', {
      nonNullable: true,
    }),
    departmentName: new FormControl('', {
      nonNullable: true,
    }),
    description: new FormControl('', {
      nonNullable: true,
    }),
    status: new FormControl<DesignationStatus>('ACTIVE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor(
    private readonly designationsService: DesignationsService,
    private readonly departmentsService: DepartmentsService,
  ) {}

  ngOnInit(): void {
    this.loadDesignations();
    this.loadDepartments();
  }

  loadDesignations(search = this.searchTerm()): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.designationsService.getDesignations(search).subscribe({
      next: (designations) => {
        this.designations.set(designations);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.serverError.set(
          error?.error?.message || 'Failed to load designations.',
        );
        this.isLoading.set(false);
        this.showToast('Failed to load designations.', 'error');
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
    this.loadDesignations(value);
  }

  onDepartmentInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.departmentSearchTerm.set(value);
    this.showDepartmentSuggestions.set(true);

    if (!value.trim()) {
      this.designationForm.controls.departmentCode.setValue('');
    }
  }

  onDepartmentFocus(): void {
    const value = this.designationForm.controls.departmentName.value;
    this.departmentSearchTerm.set(value);
    this.showDepartmentSuggestions.set(true);
  }

  onDepartmentBlur(): void {
    setTimeout(() => {
      this.showDepartmentSuggestions.set(false);
    }, 160);
  }

  selectDepartment(department: Department): void {
    this.designationForm.controls.departmentCode.setValue(
      department.departmentCode,
    );
    this.designationForm.controls.departmentName.setValue(
      department.departmentName,
    );
    this.departmentSearchTerm.set(department.departmentName);
    this.showDepartmentSuggestions.set(false);
  }

  clearDepartmentSelection(): void {
    this.designationForm.controls.departmentCode.setValue('');
    this.designationForm.controls.departmentName.setValue('');
    this.departmentSearchTerm.set('');
    this.showDepartmentSuggestions.set(false);
  }

  openCreateModal(): void {
    this.selectedDesignation.set(null);

    this.designationForm.reset({
      designationCode: '',
      designationName: '',
      departmentCode: '',
      departmentName: '',
      description: '',
      status: 'ACTIVE',
    });

    this.designationsService.generateNextDesignationCode().subscribe({
      next: (designationCode) => {
        this.designationForm.controls.designationCode.setValue(designationCode);
      },
      error: () => {
        this.designationForm.controls.designationCode.setValue('DES-0001');
        this.showToast('Could not generate next designation ID.', 'error');
      },
    });

    this.resetSuggestionState();
    this.serverError.set('');
    this.showDesignationModal.set(true);
  }

  openEditModal(designation: Designation): void {
    this.selectedDesignation.set(designation);

    this.designationForm.reset({
      designationCode: designation.designationCode,
      designationName: designation.designationName,
      departmentCode: designation.departmentCode || '',
      departmentName: designation.departmentName || '',
      description: designation.description || '',
      status: designation.status,
    });

    this.departmentSearchTerm.set(designation.departmentName || '');
    this.showDepartmentSuggestions.set(false);
    this.serverError.set('');
    this.showDesignationModal.set(true);
  }

  closeDesignationModal(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.showDesignationModal.set(false);
    this.selectedDesignation.set(null);
    this.resetSuggestionState();
    this.serverError.set('');
  }

  saveDesignation(): void {
    this.designationForm.markAllAsTouched();
    this.serverError.set('');

    if (this.designationForm.invalid || this.isSubmitting()) {
      return;
    }

    const selectedDesignation = this.selectedDesignation();
    const payload = this.buildDesignationPayload();

    this.isSubmitting.set(true);

    if (selectedDesignation) {
      this.designationsService
        .updateDesignation(selectedDesignation.id, payload)
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.closeDesignationModal();
            this.loadDesignations();
            this.showToast('Designation updated successfully.', 'success');
          },
          error: (error) => {
            this.isSubmitting.set(false);
            this.serverError.set(
              error?.error?.message || 'Failed to update designation.',
            );
            this.showToast('Failed to update designation.', 'error');
          },
        });

      return;
    }

    this.designationsService.createDesignation(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeDesignationModal();
        this.loadDesignations();
        this.showToast('Designation added successfully.', 'success');
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.serverError.set(
          error?.error?.message || 'Failed to create designation.',
        );
        this.showToast('Failed to create designation.', 'error');
      },
    });
  }

  openDeleteModal(designation: Designation): void {
    this.designationToDelete.set(designation);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.designationToDelete.set(null);
  }

  confirmDeleteDesignation(): void {
    const designation = this.designationToDelete();

    if (!designation || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);

    this.designationsService.deleteDesignation(designation.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.designationToDelete.set(null);
        this.loadDesignations();
        this.showToast('Designation deleted successfully.', 'success');
      },
      error: (error) => {
        this.isDeleting.set(false);
        this.designationToDelete.set(null);
        this.serverError.set(
          error?.error?.message || 'Failed to delete designation.',
        );
        this.showToast('Failed to delete designation.', 'error');
      },
    });
  }

  getInitials(designation: Designation): string {
    return designation.designationName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
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

  getStatusLabel(status: DesignationStatus): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  getDepartmentLabel(designation: Designation): string {
    return designation.departmentName || 'Common Designation';
  }

  isInvalid(controlName: keyof typeof this.designationForm.controls): boolean {
    const control = this.designationForm.controls[controlName];
    return control.invalid && control.touched;
  }

  private buildDesignationPayload(): CreateDesignationPayload {
    const formValue = this.designationForm.getRawValue();

    const payload: CreateDesignationPayload = {
      designationCode: formValue.designationCode.trim(),
      designationName: formValue.designationName.trim(),
      status: formValue.status,
    };

    if (formValue.departmentCode.trim()) {
      payload.departmentCode = formValue.departmentCode.trim();
    }

    if (formValue.departmentName.trim()) {
      payload.departmentName = formValue.departmentName.trim();
    }

    if (formValue.description.trim()) {
      payload.description = formValue.description.trim();
    }

    return payload;
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
