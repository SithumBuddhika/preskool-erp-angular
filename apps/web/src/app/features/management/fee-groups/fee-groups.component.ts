import { Component, OnInit, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  CreateFeeGroupPayload,
  FeeGroup,
  FeeGroupStatus,
} from '../../../core/models/fee-group.model';
import { FeeType } from '../../../core/models/fee.model';
import { SchoolClass } from '../../../core/models/school-class.model';
import { ClassesService } from '../../../core/services/classes.service';
import { FeeGroupsService } from '../../../core/services/fee-groups.service';

type ToastType = 'success' | 'error';

@Component({
  selector: 'app-fee-groups',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './fee-groups.component.html',
  styleUrl: './fee-groups.component.scss',
})
export class FeeGroupsComponent implements OnInit {
  feeGroups = signal<FeeGroup[]>([]);
  classes = signal<SchoolClass[]>([]);

  selectedFeeGroup = signal<FeeGroup | null>(null);
  feeGroupToDelete = signal<FeeGroup | null>(null);

  isLoading = signal(false);
  isSubmitting = signal(false);
  isDeleting = signal(false);
  showFeeGroupModal = signal(false);

  serverError = signal('');
  searchTerm = signal('');

  showClassSuggestions = signal(false);
  classSearchTerm = signal('');

  toast = signal<{ message: string; type: ToastType } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  isEditMode = computed(() => this.selectedFeeGroup() !== null);

  activeFeeGroups = computed(
    () => this.feeGroups().filter((group) => group.status === 'ACTIVE').length,
  );

  inactiveFeeGroups = computed(
    () =>
      this.feeGroups().filter((group) => group.status === 'INACTIVE').length,
  );

  classSpecificGroups = computed(
    () => this.feeGroups().filter((group) => Boolean(group.className)).length,
  );

  totalFeeAmount = computed(() =>
    this.feeGroups().reduce(
      (total, group) => total + Number(group.amount || 0),
      0,
    ),
  );

  filteredClasses = computed(() => {
    const keyword = this.classSearchTerm().trim().toLowerCase();

    const activeClasses = this.classes().filter(
      (schoolClass) => schoolClass.status !== 'INACTIVE',
    );

    if (!keyword) {
      return activeClasses.slice(0, 6);
    }

    return activeClasses
      .filter((schoolClass) => {
        const searchableText = [
          schoolClass.className,
          schoolClass.section,
          schoolClass.classTeacher,
          schoolClass.roomNo,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(keyword);
      })
      .slice(0, 6);
  });

  feeGroupForm = new FormGroup({
    feeGroupCode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    feeGroupName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    className: new FormControl('', {
      nonNullable: true,
    }),
    section: new FormControl('', {
      nonNullable: true,
    }),
    feeType: new FormControl<FeeType>('TUITION', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    amount: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    dueDays: new FormControl('', {
      nonNullable: true,
      validators: [Validators.min(0)],
    }),
    description: new FormControl('', {
      nonNullable: true,
    }),
    status: new FormControl<FeeGroupStatus>('ACTIVE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor(
    private readonly feeGroupsService: FeeGroupsService,
    private readonly classesService: ClassesService,
  ) {}

  ngOnInit(): void {
    this.loadFeeGroups();
    this.loadClasses();
  }

  loadFeeGroups(search = this.searchTerm()): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.feeGroupsService.getFeeGroups(search).subscribe({
      next: (feeGroups) => {
        this.feeGroups.set(feeGroups);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.serverError.set(
          error?.error?.message || 'Failed to load fee groups.',
        );
        this.isLoading.set(false);
        this.showToast('Failed to load fee groups.', 'error');
      },
    });
  }

  loadClasses(): void {
    this.classesService.getClasses().subscribe({
      next: (classes) => {
        this.classes.set(classes);
      },
      error: () => {
        this.showToast('Class suggestions could not load.', 'error');
      },
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.loadFeeGroups(value);
  }

  onClassInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.classSearchTerm.set(value);
    this.showClassSuggestions.set(true);

    if (!value.trim()) {
      this.feeGroupForm.controls.section.setValue('');
    }
  }

  onClassFocus(): void {
    const value = this.getClassDisplayValue();
    this.classSearchTerm.set(value);
    this.showClassSuggestions.set(true);
  }

  onClassBlur(): void {
    setTimeout(() => {
      this.showClassSuggestions.set(false);
    }, 160);
  }

  selectClass(schoolClass: SchoolClass): void {
    const classLabel = this.getClassLabel(schoolClass);

    this.feeGroupForm.controls.className.setValue(schoolClass.className);
    this.feeGroupForm.controls.section.setValue(schoolClass.section);
    this.classSearchTerm.set(classLabel);
    this.showClassSuggestions.set(false);
  }

  clearClassSelection(): void {
    this.feeGroupForm.controls.className.setValue('');
    this.feeGroupForm.controls.section.setValue('');
    this.classSearchTerm.set('');
    this.showClassSuggestions.set(false);
  }

  openCreateModal(): void {
    this.selectedFeeGroup.set(null);

    this.feeGroupForm.reset({
      feeGroupCode: '',
      feeGroupName: '',
      className: '',
      section: '',
      feeType: 'TUITION',
      amount: '',
      dueDays: '',
      description: '',
      status: 'ACTIVE',
    });

    this.feeGroupsService.generateNextFeeGroupCode().subscribe({
      next: (feeGroupCode) => {
        this.feeGroupForm.controls.feeGroupCode.setValue(feeGroupCode);
      },
      error: () => {
        this.feeGroupForm.controls.feeGroupCode.setValue('FGP-0001');
        this.showToast('Could not generate next fee group ID.', 'error');
      },
    });

    this.resetSuggestionState();
    this.serverError.set('');
    this.showFeeGroupModal.set(true);
  }

  openEditModal(feeGroup: FeeGroup): void {
    this.selectedFeeGroup.set(feeGroup);

    this.feeGroupForm.reset({
      feeGroupCode: feeGroup.feeGroupCode,
      feeGroupName: feeGroup.feeGroupName,
      className: feeGroup.className || '',
      section: feeGroup.section || '',
      feeType: feeGroup.feeType,
      amount: String(feeGroup.amount),
      dueDays:
        feeGroup.dueDays !== null && feeGroup.dueDays !== undefined
          ? String(feeGroup.dueDays)
          : '',
      description: feeGroup.description || '',
      status: feeGroup.status,
    });

    this.classSearchTerm.set(
      `${feeGroup.className || ''} ${feeGroup.section || ''}`.trim(),
    );

    this.showClassSuggestions.set(false);
    this.serverError.set('');
    this.showFeeGroupModal.set(true);
  }

  closeFeeGroupModal(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.showFeeGroupModal.set(false);
    this.selectedFeeGroup.set(null);
    this.resetSuggestionState();
    this.serverError.set('');
  }

  saveFeeGroup(): void {
    this.feeGroupForm.markAllAsTouched();
    this.serverError.set('');

    if (this.feeGroupForm.invalid || this.isSubmitting()) {
      return;
    }

    const selectedFeeGroup = this.selectedFeeGroup();
    const payload = this.buildFeeGroupPayload();

    this.isSubmitting.set(true);

    if (selectedFeeGroup) {
      this.feeGroupsService
        .updateFeeGroup(selectedFeeGroup.id, payload)
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.closeFeeGroupModal();
            this.loadFeeGroups();
            this.showToast('Fee group updated successfully.', 'success');
          },
          error: (error) => {
            this.isSubmitting.set(false);
            this.serverError.set(
              error?.error?.message || 'Failed to update fee group.',
            );
            this.showToast('Failed to update fee group.', 'error');
          },
        });

      return;
    }

    this.feeGroupsService.createFeeGroup(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeFeeGroupModal();
        this.loadFeeGroups();
        this.showToast('Fee group added successfully.', 'success');
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.serverError.set(
          error?.error?.message || 'Failed to create fee group.',
        );
        this.showToast('Failed to create fee group.', 'error');
      },
    });
  }

  openDeleteModal(feeGroup: FeeGroup): void {
    this.feeGroupToDelete.set(feeGroup);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.feeGroupToDelete.set(null);
  }

  confirmDeleteFeeGroup(): void {
    const feeGroup = this.feeGroupToDelete();

    if (!feeGroup || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);

    this.feeGroupsService.deleteFeeGroup(feeGroup.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.feeGroupToDelete.set(null);
        this.loadFeeGroups();
        this.showToast('Fee group deleted successfully.', 'success');
      },
      error: (error) => {
        this.isDeleting.set(false);
        this.feeGroupToDelete.set(null);
        this.serverError.set(
          error?.error?.message || 'Failed to delete fee group.',
        );
        this.showToast('Failed to delete fee group.', 'error');
      },
    });
  }

  getClassLabel(schoolClass: SchoolClass): string {
    return `${schoolClass.className} ${schoolClass.section}`.trim();
  }

  getClassInitial(schoolClass: SchoolClass): string {
    const classInitial = schoolClass.className.charAt(0) || 'C';
    const sectionInitial = schoolClass.section.charAt(0) || '';

    return `${classInitial}${sectionInitial}`.toUpperCase();
  }

  getFeeTypeLabel(type: FeeType): string {
    return type
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  getStatusLabel(status: FeeGroupStatus): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  getGroupClassLabel(feeGroup: FeeGroup): string {
    const label =
      `${feeGroup.className || ''} ${feeGroup.section || ''}`.trim();
    return label || 'All Classes';
  }

  formatMoney(amount?: number | null): string {
    return `Rs. ${Number(amount || 0).toLocaleString()}`;
  }

  isInvalid(controlName: keyof typeof this.feeGroupForm.controls): boolean {
    const control = this.feeGroupForm.controls[controlName];
    return control.invalid && control.touched;
  }

  private getClassDisplayValue(): string {
    const className = this.feeGroupForm.controls.className.value;
    const section = this.feeGroupForm.controls.section.value;

    return `${className} ${section}`.trim();
  }

  private buildFeeGroupPayload(): CreateFeeGroupPayload {
    const formValue = this.feeGroupForm.getRawValue();

    const payload: CreateFeeGroupPayload = {
      feeGroupCode: formValue.feeGroupCode.trim(),
      feeGroupName: formValue.feeGroupName.trim(),
      feeType: formValue.feeType,
      amount: Number(formValue.amount || 0),
      status: formValue.status,
    };

    if (formValue.className.trim()) {
      payload.className = formValue.className.trim();
    }

    if (formValue.section.trim()) {
      payload.section = formValue.section.trim();
    }

    if (formValue.dueDays.trim() !== '') {
      payload.dueDays = Number(formValue.dueDays);
    }

    if (formValue.description.trim()) {
      payload.description = formValue.description.trim();
    }

    return payload;
  }

  private resetSuggestionState(): void {
    this.classSearchTerm.set('');
    this.showClassSuggestions.set(false);
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
