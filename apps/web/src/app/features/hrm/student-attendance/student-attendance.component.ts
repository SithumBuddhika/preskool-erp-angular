import { Component, OnInit, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Student } from '../../../core/models/student.model';
import {
  CreateStudentAttendancePayload,
  StudentAttendance,
  StudentAttendanceStatus,
} from '../../../core/models/student-attendance.model';
import { StudentAttendanceService } from '../../../core/services/student-attendance.service';
import { StudentsService } from '../../../core/services/students.service';

type ToastType = 'success' | 'error';

@Component({
  selector: 'app-student-attendance',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './student-attendance.component.html',
  styleUrl: './student-attendance.component.scss',
})
export class StudentAttendanceComponent implements OnInit {
  attendanceRecords = signal<StudentAttendance[]>([]);
  students = signal<Student[]>([]);

  selectedAttendance = signal<StudentAttendance | null>(null);
  attendanceToDelete = signal<StudentAttendance | null>(null);

  isLoading = signal(false);
  isSubmitting = signal(false);
  isDeleting = signal(false);
  showAttendanceModal = signal(false);

  serverError = signal('');
  searchTerm = signal('');

  showStudentSuggestions = signal(false);
  studentSearchTerm = signal('');

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

  filteredStudents = computed(() => {
    const keyword = this.studentSearchTerm().trim().toLowerCase();

    const activeStudents = this.students().filter(
      (student) => student.status === 'ACTIVE',
    );

    if (!keyword) {
      return activeStudents.slice(0, 8);
    }

    return activeStudents
      .filter((student) => {
        const searchableText = [
          student.admissionNo,
          student.firstName,
          student.lastName,
          student.email,
          student.phone,
          student.className,
          student.section,
          student.guardianName,
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
    studentAdmissionNo: new FormControl('', {
      nonNullable: true,
    }),
    studentName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    className: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    section: new FormControl('', {
      nonNullable: true,
    }),
    attendanceDate: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    status: new FormControl<StudentAttendanceStatus>('PRESENT', {
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
    private readonly studentAttendanceService: StudentAttendanceService,
    private readonly studentsService: StudentsService,
  ) {}

  ngOnInit(): void {
    this.loadAttendanceRecords();
    this.loadStudents();
  }

  loadAttendanceRecords(search = this.searchTerm()): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.studentAttendanceService.getAttendanceRecords(search).subscribe({
      next: (attendanceRecords) => {
        this.attendanceRecords.set(attendanceRecords);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.serverError.set(
          error?.error?.message || 'Failed to load attendance records.',
        );
        this.isLoading.set(false);
        this.showToast('Failed to load attendance records.', 'error');
      },
    });
  }

  loadStudents(): void {
    this.studentsService.getStudents().subscribe({
      next: (students) => {
        this.students.set(students);
      },
      error: () => {
        this.showToast('Student suggestions could not load.', 'error');
      },
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.loadAttendanceRecords(value);
  }

  onStudentInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.studentSearchTerm.set(value);
    this.showStudentSuggestions.set(true);

    if (!value.trim()) {
      this.clearStudentSelection();
    }
  }

  onStudentFocus(): void {
    const value = this.attendanceForm.controls.studentName.value;
    this.studentSearchTerm.set(value);
    this.showStudentSuggestions.set(true);
  }

  onStudentBlur(): void {
    setTimeout(() => {
      this.showStudentSuggestions.set(false);
    }, 160);
  }

  selectStudent(student: Student): void {
    const studentName = this.getStudentFullName(student);

    this.attendanceForm.controls.studentAdmissionNo.setValue(
      student.admissionNo,
    );
    this.attendanceForm.controls.studentName.setValue(studentName);
    this.attendanceForm.controls.className.setValue(student.className);
    this.attendanceForm.controls.section.setValue(student.section || '');

    this.studentSearchTerm.set(`${student.admissionNo} - ${studentName}`);
    this.showStudentSuggestions.set(false);
  }

  clearStudentSelection(): void {
    this.attendanceForm.controls.studentAdmissionNo.setValue('');
    this.attendanceForm.controls.studentName.setValue('');
    this.attendanceForm.controls.className.setValue('');
    this.attendanceForm.controls.section.setValue('');
    this.studentSearchTerm.set('');
    this.showStudentSuggestions.set(false);
  }

  openCreateModal(): void {
    this.selectedAttendance.set(null);

    this.attendanceForm.reset({
      attendanceCode: '',
      studentAdmissionNo: '',
      studentName: '',
      className: '',
      section: '',
      attendanceDate: this.getTodayForInput(),
      status: 'PRESENT',
      checkInTime: '',
      checkOutTime: '',
      remarks: '',
    });

    this.studentAttendanceService.generateNextAttendanceCode().subscribe({
      next: (attendanceCode) => {
        this.attendanceForm.controls.attendanceCode.setValue(attendanceCode);
      },
      error: () => {
        this.attendanceForm.controls.attendanceCode.setValue('ATT-0001');
        this.showToast('Could not generate next attendance ID.', 'error');
      },
    });

    this.resetSuggestionState();
    this.serverError.set('');
    this.showAttendanceModal.set(true);
  }

  openEditModal(attendance: StudentAttendance): void {
    this.selectedAttendance.set(attendance);

    this.attendanceForm.reset({
      attendanceCode: attendance.attendanceCode,
      studentAdmissionNo: attendance.studentAdmissionNo || '',
      studentName: attendance.studentName,
      className: attendance.className,
      section: attendance.section || '',
      attendanceDate: this.formatDateForInput(attendance.attendanceDate),
      status: attendance.status,
      checkInTime: attendance.checkInTime || '',
      checkOutTime: attendance.checkOutTime || '',
      remarks: attendance.remarks || '',
    });

    this.studentSearchTerm.set(
      attendance.studentAdmissionNo
        ? `${attendance.studentAdmissionNo} - ${attendance.studentName}`
        : attendance.studentName,
    );

    this.showStudentSuggestions.set(false);
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
      this.studentAttendanceService
        .updateAttendanceRecord(selectedAttendance.id, payload)
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.closeAttendanceModal();
            this.loadAttendanceRecords();
            this.showToast(
              'Attendance record updated successfully.',
              'success',
            );
          },
          error: (error) => {
            this.isSubmitting.set(false);
            this.serverError.set(
              error?.error?.message || 'Failed to update attendance record.',
            );
            this.showToast('Failed to update attendance record.', 'error');
          },
        });

      return;
    }

    this.studentAttendanceService.createAttendanceRecord(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeAttendanceModal();
        this.loadAttendanceRecords();
        this.showToast('Attendance record added successfully.', 'success');
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.serverError.set(
          error?.error?.message || 'Failed to create attendance record.',
        );
        this.showToast('Failed to create attendance record.', 'error');
      },
    });
  }

  openDeleteModal(attendance: StudentAttendance): void {
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

    this.studentAttendanceService
      .deleteAttendanceRecord(attendance.id)
      .subscribe({
        next: () => {
          this.isDeleting.set(false);
          this.attendanceToDelete.set(null);
          this.loadAttendanceRecords();
          this.showToast('Attendance record deleted successfully.', 'success');
        },
        error: (error) => {
          this.isDeleting.set(false);
          this.attendanceToDelete.set(null);
          this.serverError.set(
            error?.error?.message || 'Failed to delete attendance record.',
          );
          this.showToast('Failed to delete attendance record.', 'error');
        },
      });
  }

  getStudentFullName(student: Student): string {
    return `${student.firstName} ${student.lastName}`.trim();
  }

  getStudentInitial(student: Student): string {
    const firstInitial = student.firstName?.charAt(0) || '';
    const lastInitial = student.lastName?.charAt(0) || '';

    return `${firstInitial}${lastInitial}`.toUpperCase() || 'S';
  }

  getAttendanceInitial(attendance: StudentAttendance): string {
    return attendance.studentName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }

  getStatusLabel(status: StudentAttendanceStatus): string {
    return status
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  getClassLabel(attendance: StudentAttendance): string {
    return `${attendance.className} ${attendance.section || ''}`.trim();
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

  private buildAttendancePayload(): CreateStudentAttendancePayload {
    const formValue = this.attendanceForm.getRawValue();

    const payload: CreateStudentAttendancePayload = {
      attendanceCode: formValue.attendanceCode.trim(),
      studentName: formValue.studentName.trim(),
      className: formValue.className.trim(),
      attendanceDate: formValue.attendanceDate,
      status: formValue.status,
    };

    if (formValue.studentAdmissionNo.trim()) {
      payload.studentAdmissionNo = formValue.studentAdmissionNo.trim();
    }

    if (formValue.section.trim()) {
      payload.section = formValue.section.trim();
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
    this.studentSearchTerm.set('');
    this.showStudentSuggestions.set(false);
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
