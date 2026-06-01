import { Component, OnInit, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  CreateParentPayload,
  Parent,
  ParentRelation,
  ParentStatus,
} from '../../../core/models/parent.model';
import { ParentsService } from '../../../core/services/parents.service';

type ToastType = 'success' | 'error';

@Component({
  selector: 'app-parents',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './parents.component.html',
  styleUrl: './parents.component.scss',
})
export class ParentsComponent implements OnInit {
  parents = signal<Parent[]>([]);
  selectedParent = signal<Parent | null>(null);
  parentToDelete = signal<Parent | null>(null);

  isLoading = signal(false);
  isSubmitting = signal(false);
  isDeleting = signal(false);
  showParentModal = signal(false);
  serverError = signal('');
  searchTerm = signal('');

  toast = signal<{ message: string; type: ToastType } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  isEditMode = computed(() => this.selectedParent() !== null);

  activeParents = computed(
    () => this.parents().filter((parent) => parent.status === 'ACTIVE').length,
  );

  inactiveParents = computed(
    () => this.parents().filter((parent) => parent.status !== 'ACTIVE').length,
  );

  fatherParents = computed(
    () =>
      this.parents().filter((parent) => parent.relation === 'FATHER').length,
  );

  motherParents = computed(
    () =>
      this.parents().filter((parent) => parent.relation === 'MOTHER').length,
  );

  parentForm = new FormGroup({
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
    relation: new FormControl<ParentRelation>('FATHER', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    occupation: new FormControl('', {
      nonNullable: true,
    }),
    address: new FormControl('', {
      nonNullable: true,
    }),
    status: new FormControl<ParentStatus>('ACTIVE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor(private readonly parentsService: ParentsService) {}

  ngOnInit(): void {
    this.loadParents();
  }

  loadParents(search = this.searchTerm()): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.parentsService.getParents(search).subscribe({
      next: (parents) => {
        this.parents.set(parents);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.serverError.set(
          error?.error?.message || 'Failed to load parents.',
        );
        this.isLoading.set(false);
        this.showToast('Failed to load parents.', 'error');
      },
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.loadParents(value);
  }

  openCreateModal(): void {
    this.selectedParent.set(null);

    this.parentForm.reset({
      fullName: '',
      email: '',
      phone: '',
      relation: 'FATHER',
      occupation: '',
      address: '',
      status: 'ACTIVE',
    });

    this.serverError.set('');
    this.showParentModal.set(true);
  }

  openEditModal(parent: Parent): void {
    this.selectedParent.set(parent);

    this.parentForm.reset({
      fullName: parent.fullName,
      email: parent.email || '',
      phone: parent.phone,
      relation: parent.relation,
      occupation: parent.occupation || '',
      address: parent.address || '',
      status: parent.status,
    });

    this.serverError.set('');
    this.showParentModal.set(true);
  }

  closeParentModal(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.showParentModal.set(false);
    this.selectedParent.set(null);
    this.serverError.set('');
  }

  saveParent(): void {
    this.parentForm.markAllAsTouched();
    this.serverError.set('');

    if (this.parentForm.invalid || this.isSubmitting()) {
      return;
    }

    const selectedParent = this.selectedParent();
    const payload = this.buildParentPayload();

    this.isSubmitting.set(true);

    if (selectedParent) {
      this.parentsService.updateParent(selectedParent.id, payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeParentModal();
          this.loadParents();
          this.showToast('Parent updated successfully.', 'success');
        },
        error: (error) => {
          this.isSubmitting.set(false);
          this.serverError.set(
            error?.error?.message || 'Failed to update parent.',
          );
          this.showToast('Failed to update parent.', 'error');
        },
      });

      return;
    }

    this.parentsService.createParent(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeParentModal();
        this.loadParents();
        this.showToast('Parent added successfully.', 'success');
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.serverError.set(
          error?.error?.message || 'Failed to create parent.',
        );
        this.showToast('Failed to create parent.', 'error');
      },
    });
  }

  openDeleteModal(parent: Parent): void {
    this.parentToDelete.set(parent);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.parentToDelete.set(null);
  }

  confirmDeleteParent(): void {
    const parent = this.parentToDelete();

    if (!parent || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);

    this.parentsService.deleteParent(parent.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.parentToDelete.set(null);
        this.loadParents();
        this.showToast('Parent deleted successfully.', 'success');
      },
      error: (error) => {
        this.isDeleting.set(false);
        this.parentToDelete.set(null);
        this.serverError.set(
          error?.error?.message || 'Failed to delete parent.',
        );
        this.showToast('Failed to delete parent.', 'error');
      },
    });
  }

  getInitials(parent: Parent): string {
    return parent.fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((name) => name[0])
      .join('')
      .toUpperCase();
  }

  getRelationLabel(relation: ParentRelation): string {
    return relation
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  getStatusLabel(status: ParentStatus): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  isInvalid(controlName: keyof typeof this.parentForm.controls): boolean {
    const control = this.parentForm.controls[controlName];
    return control.invalid && control.touched;
  }

  private buildParentPayload(): CreateParentPayload {
    const formValue = this.parentForm.getRawValue();

    const payload: CreateParentPayload = {
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
