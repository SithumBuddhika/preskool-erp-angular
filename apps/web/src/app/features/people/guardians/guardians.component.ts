import { Component, OnInit, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  CreateGuardianPayload,
  Guardian,
  GuardianRelation,
} from '../../../core/models/guardian.model';
import { GuardiansService } from '../../../core/services/guardians.service';

type ToastType = 'success' | 'error';

@Component({
  selector: 'app-guardians',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './guardians.component.html',
  styleUrl: './guardians.component.scss',
})
export class GuardiansComponent implements OnInit {
  guardians = signal<Guardian[]>([]);
  selectedGuardian = signal<Guardian | null>(null);
  guardianToDelete = signal<Guardian | null>(null);

  isLoading = signal(false);
  isSubmitting = signal(false);
  isDeleting = signal(false);
  showGuardianModal = signal(false);
  serverError = signal('');
  searchTerm = signal('');

  toast = signal<{ message: string; type: ToastType } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  isEditMode = computed(() => this.selectedGuardian() !== null);

  activeGuardians = computed(
    () =>
      this.guardians().filter((guardian) => guardian.status === 'ACTIVE')
        .length,
  );

  inactiveGuardians = computed(
    () =>
      this.guardians().filter((guardian) => guardian.status !== 'ACTIVE')
        .length,
  );

  guardianForm = new FormGroup({
    fullName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.email],
    }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    relation: new FormControl<GuardianRelation>('UNCLE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    occupation: new FormControl('', {
      nonNullable: true,
    }),
    address: new FormControl('', {
      nonNullable: true,
    }),
    status: new FormControl<'ACTIVE' | 'INACTIVE'>('ACTIVE', {
      nonNullable: true,
    }),
  });

  constructor(private readonly guardiansService: GuardiansService) {}

  ngOnInit(): void {
    this.loadGuardians();
  }

  loadGuardians(search = this.searchTerm()): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.guardiansService.getGuardians(search).subscribe({
      next: (guardians) => {
        this.guardians.set(guardians);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.serverError.set(
          error?.error?.message || 'Failed to load guardians.',
        );
        this.isLoading.set(false);
        this.showToast('Failed to load guardians.', 'error');
      },
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.loadGuardians(value);
  }

  openCreateModal(): void {
    this.selectedGuardian.set(null);

    this.guardianForm.reset({
      fullName: '',
      email: '',
      phone: '',
      relation: 'UNCLE',
      occupation: '',
      address: '',
      status: 'ACTIVE',
    });

    this.serverError.set('');
    this.showGuardianModal.set(true);
  }

  openEditModal(guardian: Guardian): void {
    this.selectedGuardian.set(guardian);

    this.guardianForm.reset({
      fullName: guardian.fullName,
      email: guardian.email || '',
      phone: guardian.phone,
      relation: guardian.relation,
      occupation: guardian.occupation || '',
      address: guardian.address || '',
      status: guardian.status,
    });

    this.serverError.set('');
    this.showGuardianModal.set(true);
  }

  closeGuardianModal(): void {
    this.showGuardianModal.set(false);
    this.selectedGuardian.set(null);
    this.serverError.set('');
  }

  saveGuardian(): void {
    this.guardianForm.markAllAsTouched();
    this.serverError.set('');

    if (this.guardianForm.invalid || this.isSubmitting()) {
      return;
    }

    const selectedGuardian = this.selectedGuardian();
    const payload = this.buildGuardianPayload();

    this.isSubmitting.set(true);

    if (selectedGuardian) {
      this.guardiansService
        .updateGuardian(selectedGuardian.id, payload)
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.closeGuardianModal();
            this.loadGuardians();
            this.showToast('Guardian updated successfully.', 'success');
          },
          error: (error) => {
            this.isSubmitting.set(false);
            this.serverError.set(
              error?.error?.message || 'Failed to update guardian.',
            );
            this.showToast('Failed to update guardian.', 'error');
          },
        });

      return;
    }

    this.guardiansService.createGuardian(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeGuardianModal();
        this.loadGuardians();
        this.showToast('Guardian added successfully.', 'success');
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.serverError.set(
          error?.error?.message || 'Failed to create guardian.',
        );
        this.showToast('Failed to create guardian.', 'error');
      },
    });
  }

  openDeleteModal(guardian: Guardian): void {
    this.guardianToDelete.set(guardian);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.guardianToDelete.set(null);
  }

  confirmDeleteGuardian(): void {
    const guardian = this.guardianToDelete();

    if (!guardian || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);

    this.guardiansService.deleteGuardian(guardian.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.guardianToDelete.set(null);
        this.loadGuardians();
        this.showToast('Guardian deleted successfully.', 'success');
      },
      error: (error) => {
        this.isDeleting.set(false);
        this.guardianToDelete.set(null);
        this.serverError.set(
          error?.error?.message || 'Failed to delete guardian.',
        );
        this.showToast('Failed to delete guardian.', 'error');
      },
    });
  }

  getInitials(guardian: Guardian): string {
    return guardian.fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((name) => name[0])
      .join('')
      .toUpperCase();
  }

  getRelationLabel(relation: GuardianRelation): string {
    return relation
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  isInvalid(controlName: keyof typeof this.guardianForm.controls): boolean {
    const control = this.guardianForm.controls[controlName];
    return control.invalid && control.touched;
  }

  private buildGuardianPayload(): CreateGuardianPayload {
    const formValue = this.guardianForm.getRawValue();

    const payload: CreateGuardianPayload = {
      fullName: formValue.fullName.trim(),
      phone: formValue.phone.trim(),
      relation: formValue.relation,
      status: formValue.status,
    };

    if (formValue.email.trim()) {
      payload.email = formValue.email.trim();
    }

    if (formValue.occupation.trim()) {
      payload.occupation = formValue.occupation.trim();
    }

    if (formValue.address.trim()) {
      payload.address = formValue.address.trim();
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
