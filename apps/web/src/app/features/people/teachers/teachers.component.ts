import { Component, OnInit, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  CreateTeacherPayload,
  Teacher,
  TeacherGender,
} from '../../../core/models/teacher.model';
import { TeachersService } from '../../../core/services/teachers.service';

type ToastType = 'success' | 'error';

@Component({
  selector: 'app-teachers',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './teachers.component.html',
  styleUrl: './teachers.component.scss',
})
export class TeachersComponent implements OnInit {
  teachers = signal<Teacher[]>([]);
  selectedTeacher = signal<Teacher | null>(null);
  teacherToDelete = signal<Teacher | null>(null);

  isLoading = signal(false);
  isSubmitting = signal(false);
  isDeleting = signal(false);
  showTeacherModal = signal(false);
  serverError = signal('');
  searchTerm = signal('');

  toast = signal<{ message: string; type: ToastType } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  isEditMode = computed(() => this.selectedTeacher() !== null);

  activeTeachers = computed(
    () =>
      this.teachers().filter((teacher) => teacher.status === 'ACTIVE').length,
  );

  inactiveTeachers = computed(
    () =>
      this.teachers().filter((teacher) => teacher.status !== 'ACTIVE').length,
  );

  teacherForm = new FormGroup({
    employeeNo: new FormControl('', {
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
    gender: new FormControl<TeacherGender>('MALE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    subject: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    qualification: new FormControl('', {
      nonNullable: true,
    }),
    joiningDate: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    address: new FormControl('', {
      nonNullable: true,
    }),
    status: new FormControl<'ACTIVE' | 'INACTIVE'>('ACTIVE', {
      nonNullable: true,
    }),
  });

  constructor(private readonly teachersService: TeachersService) {}

  ngOnInit(): void {
    this.loadTeachers();
  }

  loadTeachers(search = this.searchTerm()): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.teachersService.getTeachers(search).subscribe({
      next: (teachers) => {
        this.teachers.set(teachers);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.serverError.set(
          error?.error?.message || 'Failed to load teachers.',
        );
        this.isLoading.set(false);
        this.showToast('Failed to load teachers.', 'error');
      },
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.loadTeachers(value);
  }

  openCreateModal(): void {
    this.selectedTeacher.set(null);

    this.teacherForm.reset({
      employeeNo: '',
      fullName: '',
      email: '',
      phone: '',
      gender: 'MALE',
      subject: '',
      qualification: '',
      joiningDate: '',
      address: '',
      status: 'ACTIVE',
    });

    this.serverError.set('');
    this.showTeacherModal.set(true);
  }

  openEditModal(teacher: Teacher): void {
    this.selectedTeacher.set(teacher);

    this.teacherForm.reset({
      employeeNo: teacher.employeeNo,
      fullName: teacher.fullName,
      email: teacher.email,
      phone: teacher.phone,
      gender: teacher.gender,
      subject: teacher.subject,
      qualification: teacher.qualification || '',
      joiningDate: this.formatDateForInput(teacher.joiningDate),
      address: teacher.address || '',
      status: teacher.status,
    });

    this.serverError.set('');
    this.showTeacherModal.set(true);
  }

  closeTeacherModal(): void {
    this.showTeacherModal.set(false);
    this.selectedTeacher.set(null);
    this.serverError.set('');
  }

  saveTeacher(): void {
    this.teacherForm.markAllAsTouched();
    this.serverError.set('');

    if (this.teacherForm.invalid || this.isSubmitting()) {
      return;
    }

    const selectedTeacher = this.selectedTeacher();
    const payload = this.buildTeacherPayload();

    this.isSubmitting.set(true);

    if (selectedTeacher) {
      this.teachersService
        .updateTeacher(selectedTeacher.id, payload)
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.closeTeacherModal();
            this.loadTeachers();
            this.showToast('Teacher updated successfully.', 'success');
          },
          error: (error) => {
            this.isSubmitting.set(false);
            this.serverError.set(
              error?.error?.message || 'Failed to update teacher.',
            );
            this.showToast('Failed to update teacher.', 'error');
          },
        });

      return;
    }

    this.teachersService.createTeacher(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeTeacherModal();
        this.loadTeachers();
        this.showToast('Teacher added successfully.', 'success');
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.serverError.set(
          error?.error?.message || 'Failed to create teacher.',
        );
        this.showToast('Failed to create teacher.', 'error');
      },
    });
  }

  openDeleteModal(teacher: Teacher): void {
    this.teacherToDelete.set(teacher);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.teacherToDelete.set(null);
  }

  confirmDeleteTeacher(): void {
    const teacher = this.teacherToDelete();

    if (!teacher || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);

    this.teachersService.deleteTeacher(teacher.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.teacherToDelete.set(null);
        this.loadTeachers();
        this.showToast('Teacher deleted successfully.', 'success');
      },
      error: (error) => {
        this.isDeleting.set(false);
        this.teacherToDelete.set(null);
        this.serverError.set(
          error?.error?.message || 'Failed to delete teacher.',
        );
        this.showToast('Failed to delete teacher.', 'error');
      },
    });
  }

  getInitials(teacher: Teacher): string {
    return teacher.fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((name) => name[0])
      .join('')
      .toUpperCase();
  }

  getGenderLabel(gender: TeacherGender): string {
    return gender.charAt(0) + gender.slice(1).toLowerCase();
  }

  formatDisplayDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  }

  isInvalid(controlName: keyof typeof this.teacherForm.controls): boolean {
    const control = this.teacherForm.controls[controlName];
    return control.invalid && control.touched;
  }

  private buildTeacherPayload(): CreateTeacherPayload {
    const formValue = this.teacherForm.getRawValue();

    const payload: CreateTeacherPayload = {
      employeeNo: formValue.employeeNo.trim(),
      fullName: formValue.fullName.trim(),
      email: formValue.email.trim(),
      phone: formValue.phone.trim(),
      gender: formValue.gender,
      subject: formValue.subject.trim(),
      joiningDate: formValue.joiningDate,
      status: formValue.status,
    };

    if (formValue.qualification.trim()) {
      payload.qualification = formValue.qualification.trim();
    }

    if (formValue.address.trim()) {
      payload.address = formValue.address.trim();
    }

    return payload;
  }

  private formatDateForInput(date: string): string {
    return new Date(date).toISOString().split('T')[0];
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
