import { Component, OnInit, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Teacher } from '../../../core/models/teacher.model';
import {
  CreateTeacherAttendancePayload,
  TeacherAttendance,
  TeacherAttendanceStatus,
} from '../../../core/models/teacher-attendance.model';
import { TeacherAttendanceService } from '../../../core/services/teacher-attendance.service';
import { TeachersService } from '../../../core/services/teachers.service';

type ToastType = 'success' | 'error';

@Component({
  selector: 'app-teacher-attendance',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './teacher-attendance.component.html',
  styleUrl: './teacher-attendance.component.scss',
})
export class TeacherAttendanceComponent implements OnInit {
  attendanceRecords = signal<TeacherAttendance[]>([]);
  teachers = signal<Teacher[]>([]);

  selectedAttendance = signal<TeacherAttendance | null>(null);
  attendanceToDelete = signal<TeacherAttendance | null>(null);

  isLoading = signal(false);
  isSubmitting = signal(false);
  isDeleting = signal(false);
  showAttendanceModal = signal(false);

  serverError = signal('');
  searchTerm = signal('');

  showTeacherSuggestions = signal(false);
  teacherSearchTerm = signal('');

  toast = signal<{ message: string; type: ToastType } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  isEditMode = computed(() => this.selectedAttendance() !== null);

  presentCount = computed(
    () =>
      this.attendanceRecords().filter((record) => record.status === 'PRESENT')
        .length,
  );

  absentCount = computed(
    () =>
      this.attendanceRecords().filter((record) => record.status === 'ABSENT')
        .length,
  );

  lateCount = computed(
    () =>
      this.attendanceRecords().filter((record) => record.status === 'LATE')
        .length,
  );

  halfDayCount = computed(
    () =>
      this.attendanceRecords().filter((record) => record.status === 'HALF_DAY')
        .length,
  );

  filteredTeachers = computed(() => {
    const keyword = this.teacherSearchTerm().trim().toLowerCase();

    const activeTeachers = this.teachers().filter(
      (teacher) => teacher.status === 'ACTIVE',
    );

    if (!keyword) {
      return activeTeachers.slice(0, 8);
    }

    return activeTeachers
      .filter((teacher) => {
        const searchableText = [
          teacher.employeeNo,
          teacher.fullName,
          teacher.email,
          teacher.phone,
          teacher.subject,
          teacher.qualification,
          teacher.status,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(keyword);
      })
      .slice(0, 8);
  });

  attendanceForm = new FormGroup({
    attendanceCode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    teacherEmployeeNo: new FormControl('', {
      nonNullable: true,
    }),
    teacherName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    subject: new FormControl('', {
      nonNullable: true,
    }),
    attendanceDate: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    status: new FormControl<TeacherAttendanceStatus>('PRESENT', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    checkInTime: new FormControl('', {
      nonNullable: true,
    }),
    checkOutTime: new FormControl('', {
      nonNullable: true,
    }),
    remarks: new FormControl('', {
      nonNullable: true,
    }),
  });

  constructor(
    private readonly teacherAttendanceService: TeacherAttendanceService,
    private readonly teachersService: TeachersService,
  ) {}

  ngOnInit(): void {
    this.loadAttendanceRecords();
    this.loadTeachers();
  }

  loadAttendanceRecords(search = this.searchTerm()): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.teacherAttendanceService.getAttendanceRecords(search).subscribe({
      next: (attendanceRecords) => {
        this.attendanceRecords.set(attendanceRecords);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.serverError.set(
          error?.error?.message || 'Failed to load teacher attendance records.',
        );
        this.isLoading.set(false);
        this.showToast('Failed to load teacher attendance records.', 'error');
      },
    });
  }

  loadTeachers(): void {
    this.teachersService.getTeachers().subscribe({
      next: (teachers) => {
        this.teachers.set(teachers);
      },
      error: () => {
        this.showToast('Teacher suggestions could not load.', 'error');
      },
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.loadAttendanceRecords(value);
  }

  onTeacherInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.teacherSearchTerm.set(value);
    this.showTeacherSuggestions.set(true);

    if (!value.trim()) {
      this.clearTeacherSelection();
    }
  }

  onTeacherFocus(): void {
    const value = this.attendanceForm.controls.teacherName.value;
    this.teacherSearchTerm.set(value);
    this.showTeacherSuggestions.set(true);
  }

  onTeacherBlur(): void {
    setTimeout(() => {
      this.showTeacherSuggestions.set(false);
    }, 160);
  }

  selectTeacher(teacher: Teacher): void {
    this.attendanceForm.controls.teacherEmployeeNo.setValue(teacher.employeeNo);
    this.attendanceForm.controls.teacherName.setValue(teacher.fullName);
    this.attendanceForm.controls.subject.setValue(teacher.subject || '');

    this.teacherSearchTerm.set(`${teacher.employeeNo} - ${teacher.fullName}`);
    this.showTeacherSuggestions.set(false);
  }

  clearTeacherSelection(): void {
    this.attendanceForm.controls.teacherEmployeeNo.setValue('');
    this.attendanceForm.controls.teacherName.setValue('');
    this.attendanceForm.controls.subject.setValue('');
    this.teacherSearchTerm.set('');
    this.showTeacherSuggestions.set(false);
  }

  openCreateModal(): void {
    this.selectedAttendance.set(null);

    this.attendanceForm.reset({
      attendanceCode: '',
      teacherEmployeeNo: '',
      teacherName: '',
      subject: '',
      attendanceDate: this.getTodayForInput(),
      status: 'PRESENT',
      checkInTime: '',
      checkOutTime: '',
      remarks: '',
    });

    this.teacherAttendanceService.generateNextAttendanceCode().subscribe({
      next: (attendanceCode) => {
        this.attendanceForm.controls.attendanceCode.setValue(attendanceCode);
      },
      error: () => {
        this.attendanceForm.controls.attendanceCode.setValue('TATT-0001');
        this.showToast(
          'Could not generate next teacher attendance ID.',
          'error',
        );
      },
    });

    this.resetSuggestionState();
    this.serverError.set('');
    this.showAttendanceModal.set(true);
  }

  openEditModal(attendance: TeacherAttendance): void {
    this.selectedAttendance.set(attendance);

    this.attendanceForm.reset({
      attendanceCode: attendance.attendanceCode,
      teacherEmployeeNo: attendance.teacherEmployeeNo || '',
      teacherName: attendance.teacherName,
      subject: attendance.subject || '',
      attendanceDate: this.formatDateForInput(attendance.attendanceDate),
      status: attendance.status,
      checkInTime: attendance.checkInTime || '',
      checkOutTime: attendance.checkOutTime || '',
      remarks: attendance.remarks || '',
    });

    this.teacherSearchTerm.set(
      attendance.teacherEmployeeNo
        ? `${attendance.teacherEmployeeNo} - ${attendance.teacherName}`
        : attendance.teacherName,
    );

    this.showTeacherSuggestions.set(false);
    this.serverError.set('');
    this.showAttendanceModal.set(true);
  }

  closeAttendanceModal(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.showAttendanceModal.set(false);
    this.selectedAttendance.set(null);
    this.resetSuggestionState();
    this.serverError.set('');
  }

  saveAttendance(): void {
    this.attendanceForm.markAllAsTouched();
    this.serverError.set('');

    if (this.attendanceForm.invalid || this.isSubmitting()) {
      return;
    }

    const selectedAttendance = this.selectedAttendance();
    const payload = this.buildAttendancePayload();

    this.isSubmitting.set(true);

    if (selectedAttendance) {
      this.teacherAttendanceService
        .updateAttendanceRecord(selectedAttendance.id, payload)
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.closeAttendanceModal();
            this.loadAttendanceRecords();
            this.showToast(
              'Teacher attendance record updated successfully.',
              'success',
            );
          },
          error: (error) => {
            this.isSubmitting.set(false);
            this.serverError.set(
              error?.error?.message ||
                'Failed to update teacher attendance record.',
            );
            this.showToast(
              'Failed to update teacher attendance record.',
              'error',
            );
          },
        });

      return;
    }

    this.teacherAttendanceService.createAttendanceRecord(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeAttendanceModal();
        this.loadAttendanceRecords();
        this.showToast(
          'Teacher attendance record added successfully.',
          'success',
        );
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.serverError.set(
          error?.error?.message ||
            'Failed to create teacher attendance record.',
        );
        this.showToast('Failed to create teacher attendance record.', 'error');
      },
    });
  }

  openDeleteModal(attendance: TeacherAttendance): void {
    this.attendanceToDelete.set(attendance);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.attendanceToDelete.set(null);
  }

  confirmDeleteAttendance(): void {
    const attendance = this.attendanceToDelete();

    if (!attendance || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);

    this.teacherAttendanceService
      .deleteAttendanceRecord(attendance.id)
      .subscribe({
        next: () => {
          this.isDeleting.set(false);
          this.attendanceToDelete.set(null);
          this.loadAttendanceRecords();
          this.showToast(
            'Teacher attendance record deleted successfully.',
            'success',
          );
        },
        error: (error) => {
          this.isDeleting.set(false);
          this.attendanceToDelete.set(null);
          this.serverError.set(
            error?.error?.message ||
              'Failed to delete teacher attendance record.',
          );
          this.showToast(
            'Failed to delete teacher attendance record.',
            'error',
          );
        },
      });
  }

  getTeacherInitial(teacher: Teacher): string {
    return teacher.fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }

  getAttendanceInitial(attendance: TeacherAttendance): string {
    return attendance.teacherName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }

  getStatusLabel(status: TeacherAttendanceStatus): string {
    return status
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  formatDisplayDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  }

  isInvalid(controlName: keyof typeof this.attendanceForm.controls): boolean {
    const control = this.attendanceForm.controls[controlName];
    return control.invalid && control.touched;
  }

  private buildAttendancePayload(): CreateTeacherAttendancePayload {
    const formValue = this.attendanceForm.getRawValue();

    const payload: CreateTeacherAttendancePayload = {
      attendanceCode: formValue.attendanceCode.trim(),
      teacherName: formValue.teacherName.trim(),
      attendanceDate: formValue.attendanceDate,
      status: formValue.status,
    };

    if (formValue.teacherEmployeeNo.trim()) {
      payload.teacherEmployeeNo = formValue.teacherEmployeeNo.trim();
    }

    if (formValue.subject.trim()) {
      payload.subject = formValue.subject.trim();
    }

    if (formValue.checkInTime.trim()) {
      payload.checkInTime = formValue.checkInTime.trim();
    }

    if (formValue.checkOutTime.trim()) {
      payload.checkOutTime = formValue.checkOutTime.trim();
    }

    if (formValue.remarks.trim()) {
      payload.remarks = formValue.remarks.trim();
    }

    return payload;
  }

  private getTodayForInput(): string {
    return new Date().toISOString().split('T')[0];
  }

  private formatDateForInput(date: string): string {
    if (!date) {
      return '';
    }

    return new Date(date).toISOString().split('T')[0];
  }

  private resetSuggestionState(): void {
    this.teacherSearchTerm.set('');
    this.showTeacherSuggestions.set(false);
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
