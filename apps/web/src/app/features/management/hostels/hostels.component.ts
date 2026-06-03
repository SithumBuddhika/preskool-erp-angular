import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  CreateHostelPayload,
  Hostel,
  HostelStatus,
  HostelType,
} from '../../../core/models/hostel.model';
import { HostelsService } from '../../../core/services/hostels.service';

type ToastType = 'success' | 'error';

@Component({
  selector: 'app-hostels',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './hostels.component.html',
  styleUrl: './hostels.component.scss',
})
export class HostelsComponent implements OnInit {
  hostels = signal<Hostel[]>([]);
  selectedHostel = signal<Hostel | null>(null);
  hostelToDelete = signal<Hostel | null>(null);

  isLoading = signal(false);
  isSubmitting = signal(false);
  isDeleting = signal(false);
  showHostelModal = signal(false);

  serverError = signal('');
  searchTerm = signal('');

  toast = signal<{ message: string; type: ToastType } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  isEditMode = computed(() => this.selectedHostel() !== null);

  activeHostels = computed(
    () => this.hostels().filter((hostel) => hostel.status === 'ACTIVE').length,
  );

  maintenanceHostels = computed(
    () =>
      this.hostels().filter((hostel) => hostel.status === 'MAINTENANCE').length,
  );

  totalBeds = computed(() =>
    this.hostels().reduce(
      (total, hostel) => total + Number(hostel.totalBeds || 0),
      0,
    ),
  );

  availableBeds = computed(() =>
    this.hostels().reduce(
      (total, hostel) => total + Number(hostel.availableBeds || 0),
      0,
    ),
  );

  hostelForm = new FormGroup({
    hostelCode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    hostelName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    hostelType: new FormControl<HostelType>('BOYS', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    wardenName: new FormControl('', {
      nonNullable: true,
    }),
    phone: new FormControl('', {
      nonNullable: true,
    }),
    address: new FormControl('', {
      nonNullable: true,
    }),
    totalRooms: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    totalBeds: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    availableBeds: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    monthlyFee: new FormControl<number | null>(null, {
      validators: [Validators.min(0)],
    }),
    status: new FormControl<HostelStatus>('ACTIVE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    notes: new FormControl('', {
      nonNullable: true,
    }),
  });

  constructor(private readonly hostelsService: HostelsService) {}

  ngOnInit(): void {
    this.loadHostels();
  }

  loadHostels(search = this.searchTerm()): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.hostelsService.getHostels(search).subscribe({
      next: (hostels) => {
        this.hostels.set(hostels);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.serverError.set(
          error?.error?.message || 'Failed to load hostels.',
        );
        this.isLoading.set(false);
        this.showToast('Failed to load hostels.', 'error');
      },
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.searchTerm.set(value);
    this.loadHostels(value);
  }

  openCreateModal(): void {
    this.selectedHostel.set(null);

    this.hostelForm.reset({
      hostelCode: '',
      hostelName: '',
      hostelType: 'BOYS',
      wardenName: '',
      phone: '',
      address: '',
      totalRooms: 1,
      totalBeds: 1,
      availableBeds: 1,
      monthlyFee: null,
      status: 'ACTIVE',
      notes: '',
    });

    this.serverError.set('');
    this.showHostelModal.set(true);

    this.hostelsService.generateNextHostelCode().subscribe({
      next: (hostelCode) => {
        if (!this.isEditMode() && this.showHostelModal()) {
          this.hostelForm.controls.hostelCode.setValue(hostelCode);
        }
      },
      error: () => {
        this.showToast(
          'Could not generate hostel code. Please enter it manually.',
          'error',
        );
      },
    });
  }

  openEditModal(hostel: Hostel): void {
    this.selectedHostel.set(hostel);

    this.hostelForm.reset({
      hostelCode: hostel.hostelCode,
      hostelName: hostel.hostelName,
      hostelType: hostel.hostelType,
      wardenName: hostel.wardenName || '',
      phone: hostel.phone || '',
      address: hostel.address || '',
      totalRooms: hostel.totalRooms,
      totalBeds: hostel.totalBeds,
      availableBeds: hostel.availableBeds,
      monthlyFee: hostel.monthlyFee ?? null,
      status: hostel.status,
      notes: hostel.notes || '',
    });

    this.serverError.set('');
    this.showHostelModal.set(true);
  }

  closeHostelModal(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.showHostelModal.set(false);
    this.selectedHostel.set(null);
    this.serverError.set('');
  }

  saveHostel(): void {
    this.hostelForm.markAllAsTouched();
    this.serverError.set('');

    if (this.hostelForm.invalid || this.isSubmitting()) {
      return;
    }

    const totalBeds = Number(this.hostelForm.controls.totalBeds.value || 0);
    const availableBeds = Number(
      this.hostelForm.controls.availableBeds.value || 0,
    );

    if (availableBeds > totalBeds) {
      this.serverError.set('Available beds cannot be greater than total beds.');
      return;
    }

    const selectedHostel = this.selectedHostel();
    const payload = this.buildHostelPayload();

    this.isSubmitting.set(true);

    if (selectedHostel) {
      this.hostelsService.updateHostel(selectedHostel.id, payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeHostelModal();
          this.loadHostels();
          this.showToast('Hostel updated successfully.', 'success');
        },
        error: (error) => {
          this.isSubmitting.set(false);
          this.serverError.set(
            error?.error?.message || 'Failed to update hostel.',
          );
          this.showToast('Failed to update hostel.', 'error');
        },
      });

      return;
    }

    this.hostelsService.createHostel(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeHostelModal();
        this.loadHostels();
        this.showToast('Hostel added successfully.', 'success');
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.serverError.set(
          error?.error?.message || 'Failed to create hostel.',
        );
        this.showToast('Failed to create hostel.', 'error');
      },
    });
  }

  openDeleteModal(hostel: Hostel): void {
    this.hostelToDelete.set(hostel);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.hostelToDelete.set(null);
  }

  confirmDeleteHostel(): void {
    const hostel = this.hostelToDelete();

    if (!hostel || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);

    this.hostelsService.deleteHostel(hostel.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.hostelToDelete.set(null);
        this.loadHostels();
        this.showToast('Hostel deleted successfully.', 'success');
      },
      error: (error) => {
        this.isDeleting.set(false);
        this.hostelToDelete.set(null);
        this.serverError.set(
          error?.error?.message || 'Failed to delete hostel.',
        );
        this.showToast('Failed to delete hostel.', 'error');
      },
    });
  }

  getHostelInitial(hostel: Hostel): string {
    return hostel.hostelName.charAt(0).toUpperCase();
  }

  getTypeLabel(type: HostelType): string {
    return type.charAt(0) + type.slice(1).toLowerCase();
  }

  getStatusLabel(status: HostelStatus): string {
    if (status === 'MAINTENANCE') {
      return 'Maintenance';
    }

    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  getBedAvailabilityLabel(hostel: Hostel): string {
    return `${hostel.availableBeds}/${hostel.totalBeds}`;
  }

  isInvalid(controlName: keyof typeof this.hostelForm.controls): boolean {
    const control = this.hostelForm.controls[controlName];

    return control.invalid && control.touched;
  }

  private buildHostelPayload(): CreateHostelPayload {
    const formValue = this.hostelForm.getRawValue();

    const payload: CreateHostelPayload = {
      hostelCode: formValue.hostelCode.trim(),
      hostelName: formValue.hostelName.trim(),
      hostelType: formValue.hostelType,
      totalRooms: Number(formValue.totalRooms || 1),
      totalBeds: Number(formValue.totalBeds || 1),
      availableBeds: Number(formValue.availableBeds || 0),
      status: formValue.status,
    };

    if (formValue.wardenName.trim()) {
      payload.wardenName = formValue.wardenName.trim();
    }

    if (formValue.phone.trim()) {
      payload.phone = formValue.phone.trim();
    }

    if (formValue.address.trim()) {
      payload.address = formValue.address.trim();
    }

    if (formValue.monthlyFee !== null && formValue.monthlyFee !== undefined) {
      payload.monthlyFee = Number(formValue.monthlyFee);
    }

    if (formValue.notes.trim()) {
      payload.notes = formValue.notes.trim();
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
