import { Component, OnInit, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { StudentsService } from '../../../core/services/students.service';
import {
  CreateStudentPayload,
  Student,
  StudentGender,
} from '../../../core/models/student.model';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './students.component.html',
  styleUrl: './students.component.scss',
})
export class StudentsComponent implements OnInit {
  students = signal<Student[]>([]);
  selectedStudent = signal<Student | null>(null);

  isLoading = signal(false);
  isSubmitting = signal(false);
  showCreateModal = signal(false);
  serverError = signal('');
  searchTerm = signal('');

  isEditMode = computed(() => this.selectedStudent() !== null);

  activeStudents = computed(
    () =>
      this.students().filter((student) => student.status === 'ACTIVE').length,
  );

  inactiveStudents = computed(
    () =>
      this.students().filter((student) => student.status !== 'ACTIVE').length,
  );

  studentForm = new FormGroup({
    admissionNo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    firstName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    lastName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.email],
    }),
    phone: new FormControl('', {
      nonNullable: true,
    }),
    gender: new FormControl<StudentGender>('MALE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    dateOfBirth: new FormControl('', {
      nonNullable: true,
    }),
    className: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    section: new FormControl('', {
      nonNullable: true,
    }),
    guardianName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    guardianPhone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    address: new FormControl('', {
      nonNullable: true,
    }),
  });

  constructor(private readonly studentsService: StudentsService) {}

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(search = this.searchTerm()): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.studentsService.getStudents(search).subscribe({
      next: (students) => {
        this.students.set(students);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.serverError.set(
          error?.error?.message || 'Failed to load students.',
        );
        this.isLoading.set(false);
      },
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.loadStudents(value);
  }

  openCreateModal(): void {
    this.selectedStudent.set(null);

    this.studentForm.reset({
      admissionNo: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      gender: 'MALE',
      dateOfBirth: '',
      className: '',
      section: '',
      guardianName: '',
      guardianPhone: '',
      address: '',
    });

    this.serverError.set('');
    this.showCreateModal.set(true);
  }

  openEditModal(student: Student): void {
    this.selectedStudent.set(student);

    this.studentForm.reset({
      admissionNo: student.admissionNo,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email || '',
      phone: student.phone || '',
      gender: student.gender,
      dateOfBirth: this.formatDateForInput(student.dateOfBirth),
      className: student.className,
      section: student.section || '',
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      address: student.address || '',
    });

    this.serverError.set('');
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
    this.selectedStudent.set(null);
    this.serverError.set('');
  }

  saveStudent(): void {
    this.studentForm.markAllAsTouched();
    this.serverError.set('');

    if (this.studentForm.invalid || this.isSubmitting()) {
      return;
    }

    const selectedStudent = this.selectedStudent();
    const payload = this.buildStudentPayload();

    this.isSubmitting.set(true);

    if (selectedStudent) {
      this.studentsService
        .updateStudent(selectedStudent.id, payload)
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.closeCreateModal();
            this.loadStudents();
          },
          error: (error) => {
            this.isSubmitting.set(false);
            this.serverError.set(
              error?.error?.message || 'Failed to update student.',
            );
          },
        });

      return;
    }

    this.studentsService.createStudent(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeCreateModal();
        this.loadStudents();
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.serverError.set(
          error?.error?.message || 'Failed to create student.',
        );
      },
    });
  }

  deleteStudent(student: Student): void {
    const confirmed = confirm(
      `Are you sure you want to delete ${student.firstName} ${student.lastName}?`,
    );

    if (!confirmed) {
      return;
    }

    this.studentsService.deleteStudent(student.id).subscribe({
      next: () => this.loadStudents(),
      error: (error) => {
        this.serverError.set(
          error?.error?.message || 'Failed to delete student.',
        );
      },
    });
  }

  getFullName(student: Student): string {
    return `${student.firstName} ${student.lastName}`;
  }

  isInvalid(controlName: keyof typeof this.studentForm.controls): boolean {
    const control = this.studentForm.controls[controlName];
    return control.invalid && control.touched;
  }

  private buildStudentPayload(): CreateStudentPayload {
    const formValue = this.studentForm.getRawValue();

    const payload: CreateStudentPayload = {
      admissionNo: formValue.admissionNo.trim(),
      firstName: formValue.firstName.trim(),
      lastName: formValue.lastName.trim(),
      gender: formValue.gender,
      className: formValue.className.trim(),
      guardianName: formValue.guardianName.trim(),
      guardianPhone: formValue.guardianPhone.trim(),
    };

    if (formValue.email.trim()) payload.email = formValue.email.trim();
    if (formValue.phone.trim()) payload.phone = formValue.phone.trim();
    if (formValue.dateOfBirth.trim()) {
      payload.dateOfBirth = formValue.dateOfBirth.trim();
    }
    if (formValue.section.trim()) payload.section = formValue.section.trim();
    if (formValue.address.trim()) payload.address = formValue.address.trim();

    return payload;
  }

  private formatDateForInput(date?: string | null): string {
    if (!date) {
      return '';
    }

    return date.split('T')[0];
  }
}
