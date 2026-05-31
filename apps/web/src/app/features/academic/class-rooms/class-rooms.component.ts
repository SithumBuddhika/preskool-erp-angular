import { Component, OnInit, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  ClassRoom,
  ClassRoomStatus,
  CreateClassRoomPayload,
} from '../../../core/models/class-room.model';
import { ClassRoomsService } from '../../../core/services/class-rooms.service';

type ToastType = 'success' | 'error';

@Component({
  selector: 'app-class-rooms',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './class-rooms.component.html',
  styleUrl: './class-rooms.component.scss',
})
export class ClassRoomsComponent implements OnInit {
  classRooms = signal<ClassRoom[]>([]);
  selectedClassRoom = signal<ClassRoom | null>(null);
  classRoomToDelete = signal<ClassRoom | null>(null);

  isLoading = signal(false);
  isSubmitting = signal(false);
  isDeleting = signal(false);
  showClassRoomModal = signal(false);
  serverError = signal('');
  searchTerm = signal('');

  toast = signal<{ message: string; type: ToastType } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  isEditMode = computed(() => this.selectedClassRoom() !== null);

  activeRooms = computed(
    () => this.classRooms().filter((room) => room.status === 'ACTIVE').length,
  );

  maintenanceRooms = computed(
    () =>
      this.classRooms().filter((room) => room.status === 'MAINTENANCE').length,
  );

  inactiveRooms = computed(
    () => this.classRooms().filter((room) => room.status === 'INACTIVE').length,
  );

  totalCapacity = computed(() =>
    this.classRooms().reduce((total, room) => total + (room.capacity || 0), 0),
  );

  classRoomForm = new FormGroup({
    roomNo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    roomName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    building: new FormControl('', {
      nonNullable: true,
    }),
    floor: new FormControl('', {
      nonNullable: true,
    }),
    capacity: new FormControl<number | null>(null, {
      validators: [Validators.min(1)],
    }),
    status: new FormControl<ClassRoomStatus>('ACTIVE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor(private readonly classRoomsService: ClassRoomsService) {}

  ngOnInit(): void {
    this.loadClassRooms();
  }

  loadClassRooms(search = this.searchTerm()): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.classRoomsService.getClassRooms(search).subscribe({
      next: (rooms) => {
        this.classRooms.set(rooms);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.serverError.set(
          error?.error?.message || 'Failed to load class rooms.',
        );
        this.isLoading.set(false);
        this.showToast('Failed to load class rooms.', 'error');
      },
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.loadClassRooms(value);
  }

  openCreateModal(): void {
    this.selectedClassRoom.set(null);

    this.classRoomForm.reset({
      roomNo: '',
      roomName: '',
      building: '',
      floor: '',
      capacity: null,
      status: 'ACTIVE',
    });

    this.serverError.set('');
    this.showClassRoomModal.set(true);
  }

  openEditModal(room: ClassRoom): void {
    this.selectedClassRoom.set(room);

    this.classRoomForm.reset({
      roomNo: room.roomNo,
      roomName: room.roomName,
      building: room.building || '',
      floor: room.floor || '',
      capacity: room.capacity || null,
      status: room.status,
    });

    this.serverError.set('');
    this.showClassRoomModal.set(true);
  }

  closeClassRoomModal(): void {
    this.showClassRoomModal.set(false);
    this.selectedClassRoom.set(null);
    this.serverError.set('');
  }

  saveClassRoom(): void {
    this.classRoomForm.markAllAsTouched();
    this.serverError.set('');

    if (this.classRoomForm.invalid || this.isSubmitting()) {
      return;
    }

    const selectedRoom = this.selectedClassRoom();
    const payload = this.buildClassRoomPayload();

    this.isSubmitting.set(true);

    if (selectedRoom) {
      this.classRoomsService
        .updateClassRoom(selectedRoom.id, payload)
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.closeClassRoomModal();
            this.loadClassRooms();
            this.showToast('Class room updated successfully.', 'success');
          },
          error: (error) => {
            this.isSubmitting.set(false);
            this.serverError.set(
              error?.error?.message || 'Failed to update class room.',
            );
            this.showToast('Failed to update class room.', 'error');
          },
        });

      return;
    }

    this.classRoomsService.createClassRoom(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeClassRoomModal();
        this.loadClassRooms();
        this.showToast('Class room added successfully.', 'success');
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.serverError.set(
          error?.error?.message || 'Failed to create class room.',
        );
        this.showToast('Failed to create class room.', 'error');
      },
    });
  }

  openDeleteModal(room: ClassRoom): void {
    this.classRoomToDelete.set(room);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.classRoomToDelete.set(null);
  }

  confirmDeleteClassRoom(): void {
    const room = this.classRoomToDelete();

    if (!room || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);

    this.classRoomsService.deleteClassRoom(room.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.classRoomToDelete.set(null);
        this.loadClassRooms();
        this.showToast('Class room deleted successfully.', 'success');
      },
      error: (error) => {
        this.isDeleting.set(false);
        this.classRoomToDelete.set(null);
        this.serverError.set(
          error?.error?.message || 'Failed to delete class room.',
        );
        this.showToast('Failed to delete class room.', 'error');
      },
    });
  }

  getRoomInitial(room: ClassRoom): string {
    return room.roomNo.charAt(0).toUpperCase();
  }

  getStatusLabel(status: ClassRoomStatus): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  isInvalid(controlName: keyof typeof this.classRoomForm.controls): boolean {
    const control = this.classRoomForm.controls[controlName];
    return control.invalid && control.touched;
  }

  private buildClassRoomPayload(): CreateClassRoomPayload {
    const formValue = this.classRoomForm.getRawValue();

    const payload: CreateClassRoomPayload = {
      roomNo: formValue.roomNo.trim(),
      roomName: formValue.roomName.trim(),
      status: formValue.status,
    };

    if (formValue.building.trim()) {
      payload.building = formValue.building.trim();
    }

    if (formValue.floor.trim()) {
      payload.floor = formValue.floor.trim();
    }

    if (formValue.capacity !== null && formValue.capacity !== undefined) {
      payload.capacity = Number(formValue.capacity);
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
