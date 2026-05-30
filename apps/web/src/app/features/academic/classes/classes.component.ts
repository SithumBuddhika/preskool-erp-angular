import { Component, OnInit, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  ClassStatus,
  CreateClassPayload,
  SchoolClass,
} from '../../../core/models/school-class.model';
import { ClassesService } from '../../../core/services/classes.service';

type ToastType = 'success' | 'error';

@Component({
  selector: 'app-classes',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './classes.component.html',
  styleUrl: './classes.component.scss',
})
export class ClassesComponent implements OnInit {
  classes = signal<SchoolClass[]>([]);
  selectedClass = signal<SchoolClass | null>(null);
  classToDelete = signal<SchoolClass | null>(null);

  isLoading = signal(false);
  isSubmitting = signal(false);
  isDeleting = signal(false);
  showClassModal = signal(false);
  serverError = signal('');
  searchTerm = signal('');

  toast = signal<{ message: string; type: ToastType } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  isEditMode = computed(() => this.selectedClass() !== null);

  activeClasses = computed(
    () => this.classes().filter((item) => item.status === 'ACTIVE').length,
  );

  inactiveClasses = computed(
    () => this.classes().filter((item) => item.status !== 'ACTIVE').length,
  );

  totalCapacity = computed(() =>
    this.classes().reduce((total, item) => total + (item.capacity || 0), 0),
  );

  classForm = new FormGroup({
    className: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    section: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    classTeacher: new FormControl('', {
      nonNullable: true,
    }),
    roomNo: new FormControl('', {
      nonNullable: true,
    }),
    capacity: new FormControl<number | null>(null, {
      validators: [Validators.min(1)],
    }),
    status: new FormControl<ClassStatus>('ACTIVE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor(private readonly classesService: ClassesService) {}

  ngOnInit(): void {
    this.loadClasses();
  }

  loadClasses(search = this.searchTerm()): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.classesService.getClasses(search).subscribe({
      next: (classes) => {
        this.classes.set(classes);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.serverError.set(
          error?.error?.message || 'Failed to load classes.',
        );
        this.isLoading.set(false);
        this.showToast('Failed to load classes.', 'error');
      },
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.loadClasses(value);
  }

  openCreateModal(): void {
    this.selectedClass.set(null);

    this.classForm.reset({
      className: '',
      section: '',
      classTeacher: '',
      roomNo: '',
      capacity: null,
      status: 'ACTIVE',
    });

    this.serverError.set('');
    this.showClassModal.set(true);
  }

  openEditModal(schoolClass: SchoolClass): void {
    this.selectedClass.set(schoolClass);

    this.classForm.reset({
      className: schoolClass.className,
      section: schoolClass.section,
      classTeacher: schoolClass.classTeacher || '',
      roomNo: schoolClass.roomNo || '',
      capacity: schoolClass.capacity || null,
      status: schoolClass.status,
    });

    this.serverError.set('');
    this.showClassModal.set(true);
  }

  closeClassModal(): void {
    this.showClassModal.set(false);
    this.selectedClass.set(null);
    this.serverError.set('');
  }

  saveClass(): void {
    this.classForm.markAllAsTouched();
    this.serverError.set('');

    if (this.classForm.invalid || this.isSubmitting()) {
      return;
    }

    const selectedClass = this.selectedClass();
    const payload = this.buildClassPayload();

    this.isSubmitting.set(true);

    if (selectedClass) {
      this.classesService.updateClass(selectedClass.id, payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeClassModal();
          this.loadClasses();
          this.showToast('Class updated successfully.', 'success');
        },
        error: (error) => {
          this.isSubmitting.set(false);
          this.serverError.set(
            error?.error?.message || 'Failed to update class.',
          );
          this.showToast('Failed to update class.', 'error');
        },
      });

      return;
    }

    this.classesService.createClass(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeClassModal();
        this.loadClasses();
        this.showToast('Class added successfully.', 'success');
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.serverError.set(
          error?.error?.message || 'Failed to create class.',
        );
        this.showToast('Failed to create class.', 'error');
      },
    });
  }

  openDeleteModal(schoolClass: SchoolClass): void {
    this.classToDelete.set(schoolClass);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.classToDelete.set(null);
  }

  confirmDeleteClass(): void {
    const schoolClass = this.classToDelete();

    if (!schoolClass || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);

    this.classesService.deleteClass(schoolClass.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.classToDelete.set(null);
        this.loadClasses();
        this.showToast('Class deleted successfully.', 'success');
      },
      error: (error) => {
        this.isDeleting.set(false);
        this.classToDelete.set(null);
        this.serverError.set(
          error?.error?.message || 'Failed to delete class.',
        );
        this.showToast('Failed to delete class.', 'error');
      },
    });
  }

  getClassLabel(schoolClass: SchoolClass): string {
    return `${schoolClass.className} ${schoolClass.section}`;
  }

  isInvalid(controlName: keyof typeof this.classForm.controls): boolean {
    const control = this.classForm.controls[controlName];
    return control.invalid && control.touched;
  }

  private buildClassPayload(): CreateClassPayload {
    const formValue = this.classForm.getRawValue();

    const payload: CreateClassPayload = {
      className: formValue.className.trim(),
      section: formValue.section.trim(),
      status: formValue.status,
    };

    if (formValue.classTeacher.trim()) {
      payload.classTeacher = formValue.classTeacher.trim();
    }

    if (formValue.roomNo.trim()) {
      payload.roomNo = formValue.roomNo.trim();
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
