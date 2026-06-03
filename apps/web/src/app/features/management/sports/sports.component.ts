import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  CreateSportPayload,
  Sport,
  SportStatus,
} from '../../../core/models/sport.model';
import { SportsService } from '../../../core/services/sports.service';

type ToastType = 'success' | 'error';

@Component({
  selector: 'app-sports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sports.component.html',
  styleUrl: './sports.component.scss',
})
export class SportsComponent implements OnInit {
  sports = signal<Sport[]>([]);
  selectedSport = signal<Sport | null>(null);
  sportToDelete = signal<Sport | null>(null);

  isLoading = signal(false);
  isSubmitting = signal(false);
  isDeleting = signal(false);
  showSportModal = signal(false);

  serverError = signal('');
  searchTerm = signal('');

  toast = signal<{ message: string; type: ToastType } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  isEditMode = computed(() => this.selectedSport() !== null);

  activeSports = computed(
    () => this.sports().filter((sport) => sport.status === 'ACTIVE').length,
  );

  inactiveSports = computed(
    () => this.sports().filter((sport) => sport.status === 'INACTIVE').length,
  );

  totalParticipants = computed(() =>
    this.sports().reduce(
      (total, sport) => total + Number(sport.currentParticipants || 0),
      0,
    ),
  );

  totalCapacity = computed(() =>
    this.sports().reduce(
      (total, sport) => total + Number(sport.maxParticipants || 0),
      0,
    ),
  );

  sportForm = new FormGroup({
    sportCode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    sportName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    category: new FormControl('', {
      nonNullable: true,
    }),
    coachName: new FormControl('', {
      nonNullable: true,
    }),
    venue: new FormControl('', {
      nonNullable: true,
    }),
    practiceDays: new FormControl('', {
      nonNullable: true,
    }),
    practiceTime: new FormControl('', {
      nonNullable: true,
    }),
    maxParticipants: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    currentParticipants: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    status: new FormControl<SportStatus>('ACTIVE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    notes: new FormControl('', {
      nonNullable: true,
    }),
  });

  constructor(private readonly sportsService: SportsService) {}

  ngOnInit(): void {
    this.loadSports();
  }

  loadSports(search = this.searchTerm()): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.sportsService.getSports(search).subscribe({
      next: (sports) => {
        this.sports.set(sports);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.serverError.set(error?.error?.message || 'Failed to load sports.');
        this.isLoading.set(false);
        this.showToast('Failed to load sports.', 'error');
      },
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.searchTerm.set(value);
    this.loadSports(value);
  }

  openCreateModal(): void {
    this.selectedSport.set(null);

    this.sportForm.reset({
      sportCode: '',
      sportName: '',
      category: '',
      coachName: '',
      venue: '',
      practiceDays: '',
      practiceTime: '',
      maxParticipants: 0,
      currentParticipants: 0,
      status: 'ACTIVE',
      notes: '',
    });

    this.serverError.set('');
    this.showSportModal.set(true);

    this.sportsService.generateNextSportCode().subscribe({
      next: (sportCode) => {
        if (!this.isEditMode() && this.showSportModal()) {
          this.sportForm.controls.sportCode.setValue(sportCode);
        }
      },
      error: () => {
        this.showToast(
          'Could not generate sport code. Please enter it manually.',
          'error',
        );
      },
    });
  }

  openEditModal(sport: Sport): void {
    this.selectedSport.set(sport);

    this.sportForm.reset({
      sportCode: sport.sportCode,
      sportName: sport.sportName,
      category: sport.category || '',
      coachName: sport.coachName || '',
      venue: sport.venue || '',
      practiceDays: sport.practiceDays || '',
      practiceTime: sport.practiceTime || '',
      maxParticipants: sport.maxParticipants,
      currentParticipants: sport.currentParticipants,
      status: sport.status,
      notes: sport.notes || '',
    });

    this.serverError.set('');
    this.showSportModal.set(true);
  }

  closeSportModal(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.showSportModal.set(false);
    this.selectedSport.set(null);
    this.serverError.set('');
  }

  saveSport(): void {
    this.sportForm.markAllAsTouched();
    this.serverError.set('');

    if (this.sportForm.invalid || this.isSubmitting()) {
      return;
    }

    const maxParticipants = Number(
      this.sportForm.controls.maxParticipants.value || 0,
    );
    const currentParticipants = Number(
      this.sportForm.controls.currentParticipants.value || 0,
    );

    if (maxParticipants > 0 && currentParticipants > maxParticipants) {
      this.serverError.set(
        'Current participants cannot be greater than max participants.',
      );
      return;
    }

    const selectedSport = this.selectedSport();
    const payload = this.buildSportPayload();

    this.isSubmitting.set(true);

    if (selectedSport) {
      this.sportsService.updateSport(selectedSport.id, payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeSportModal();
          this.loadSports();
          this.showToast('Sport updated successfully.', 'success');
        },
        error: (error) => {
          this.isSubmitting.set(false);
          this.serverError.set(
            error?.error?.message || 'Failed to update sport.',
          );
          this.showToast('Failed to update sport.', 'error');
        },
      });

      return;
    }

    this.sportsService.createSport(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeSportModal();
        this.loadSports();
        this.showToast('Sport added successfully.', 'success');
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.serverError.set(
          error?.error?.message || 'Failed to create sport.',
        );
        this.showToast('Failed to create sport.', 'error');
      },
    });
  }

  openDeleteModal(sport: Sport): void {
    this.sportToDelete.set(sport);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.sportToDelete.set(null);
  }

  confirmDeleteSport(): void {
    const sport = this.sportToDelete();

    if (!sport || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);

    this.sportsService.deleteSport(sport.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.sportToDelete.set(null);
        this.loadSports();
        this.showToast('Sport deleted successfully.', 'success');
      },
      error: (error) => {
        this.isDeleting.set(false);
        this.sportToDelete.set(null);
        this.serverError.set(
          error?.error?.message || 'Failed to delete sport.',
        );
        this.showToast('Failed to delete sport.', 'error');
      },
    });
  }

  getSportInitial(sport: Sport): string {
    return sport.sportName.charAt(0).toUpperCase();
  }

  getStatusLabel(status: SportStatus): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  getParticipantLabel(sport: Sport): string {
    if (!sport.maxParticipants || sport.maxParticipants === 0) {
      return `${sport.currentParticipants}`;
    }

    return `${sport.currentParticipants}/${sport.maxParticipants}`;
  }

  isInvalid(controlName: keyof typeof this.sportForm.controls): boolean {
    const control = this.sportForm.controls[controlName];

    return control.invalid && control.touched;
  }

  private buildSportPayload(): CreateSportPayload {
    const formValue = this.sportForm.getRawValue();

    const payload: CreateSportPayload = {
      sportCode: formValue.sportCode.trim(),
      sportName: formValue.sportName.trim(),
      maxParticipants: Number(formValue.maxParticipants || 0),
      currentParticipants: Number(formValue.currentParticipants || 0),
      status: formValue.status,
    };

    if (formValue.category.trim()) {
      payload.category = formValue.category.trim();
    }

    if (formValue.coachName.trim()) {
      payload.coachName = formValue.coachName.trim();
    }

    if (formValue.venue.trim()) {
      payload.venue = formValue.venue.trim();
    }

    if (formValue.practiceDays.trim()) {
      payload.practiceDays = formValue.practiceDays.trim();
    }

    if (formValue.practiceTime.trim()) {
      payload.practiceTime = formValue.practiceTime.trim();
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
