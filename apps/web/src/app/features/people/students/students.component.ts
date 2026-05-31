import { Component, OnInit, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Guardian } from '../../../core/models/guardian.model';
import { Parent } from '../../../core/models/parent.model';
import { SchoolClass } from '../../../core/models/school-class.model';
import {
  CreateStudentPayload,
  Student,
  StudentGender,
  StudentStatus,
} from '../../../core/models/student.model';
import { ClassesService } from '../../../core/services/classes.service';
import { GuardiansService } from '../../../core/services/guardians.service';
import { ParentsService } from '../../../core/services/parents.service';
import { StudentsService } from '../../../core/services/students.service';

type ToastType = 'success' | 'error';
type GuardianSource = 'Parent' | 'Guardian';

type GuardianSuggestion = {
  id: string;
  source: GuardianSource;
  fullName: string;
  phone: string;
  email?: string | null;
  relation?: string;
  status: string;
};

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './students.component.html',
  styleUrl: './students.component.scss',
})
export class StudentsComponent implements OnInit {
  students = signal<Student[]>([]);
  classes = signal<SchoolClass[]>([]);
  parents = signal<Parent[]>([]);
  guardians = signal<Guardian[]>([]);

  selectedStudent = signal<Student | null>(null);
  studentToDelete = signal<Student | null>(null);

  isLoading = signal(false);
  isSubmitting = signal(false);
  isDeleting = signal(false);
  showCreateModal = signal(false);

  serverError = signal('');
  searchTerm = signal('');

  showClassSuggestions = signal(false);
  classSearchTerm = signal('');

  showGuardianSuggestions = signal(false);
  guardianSearchTerm = signal('');

  toast = signal<{ message: string; type: ToastType } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  isEditMode = computed(() => this.selectedStudent() !== null);

  activeStudents = computed(
    () =>
      this.students().filter((student) => student.status === 'ACTIVE').length,
  );

  inactiveStudents = computed(
    () =>
      this.students().filter((student) => student.status !== 'ACTIVE').length,
  );

  totalClasses = computed(() => {
    const classNames = this.students()
      .map((student) => `${student.className} ${student.section || ''}`.trim())
      .filter(Boolean);

    return new Set(classNames).size;
  });

  guardianSuggestions = computed<GuardianSuggestion[]>(() => {
    const parentSuggestions: GuardianSuggestion[] = this.parents()
      .filter((parent) => parent.status === 'ACTIVE')
      .map((parent) => ({
        id: parent.id,
        source: 'Parent',
        fullName: parent.fullName,
        phone: parent.phone,
        email: parent.email,
        relation: parent.relation,
        status: parent.status,
      }));

    const guardianSuggestions: GuardianSuggestion[] = this.guardians()
      .filter((guardian) => guardian.status === 'ACTIVE')
      .map((guardian) => ({
        id: guardian.id,
        source: 'Guardian',
        fullName: guardian.fullName,
        phone: guardian.phone,
        email: guardian.email,
        relation: guardian.relation,
        status: guardian.status,
      }));

    return [...parentSuggestions, ...guardianSuggestions];
  });

  filteredClasses = computed(() => {
    const keyword = this.classSearchTerm().trim().toLowerCase();

    const activeClasses = this.classes().filter(
      (schoolClass) => schoolClass.status !== 'INACTIVE',
    );

    if (!keyword) {
      return activeClasses.slice(0, 6);
    }

    return activeClasses
      .filter((schoolClass) => {
        const searchableText = [
          schoolClass.className,
          schoolClass.section,
          schoolClass.classTeacher,
          schoolClass.roomNo,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(keyword);
      })
      .slice(0, 6);
  });

  filteredGuardians = computed(() => {
    const keyword = this.guardianSearchTerm().trim().toLowerCase();

    if (!keyword) {
      return this.guardianSuggestions().slice(0, 8);
    }

    return this.guardianSuggestions()
      .filter((guardian) => {
        const searchableText = [
          guardian.fullName,
          guardian.phone,
          guardian.email,
          guardian.relation,
          guardian.source,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(keyword);
      })
      .slice(0, 8);
  });

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
    status: new FormControl<StudentStatus>('ACTIVE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor(
    private readonly studentsService: StudentsService,
    private readonly classesService: ClassesService,
    private readonly parentsService: ParentsService,
    private readonly guardiansService: GuardiansService,
  ) {}

  ngOnInit(): void {
    this.loadStudents();
    this.loadClasses();
    this.loadParents();
    this.loadGuardians();
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
        this.showToast('Failed to load students.', 'error');
      },
    });
  }

  loadClasses(): void {
    this.classesService.getClasses().subscribe({
      next: (classes) => {
        this.classes.set(classes);
      },
      error: () => {
        this.showToast('Class suggestions could not load.', 'error');
      },
    });
  }

  loadParents(): void {
    this.parentsService.getParents().subscribe({
      next: (parents) => {
        this.parents.set(parents);
      },
      error: () => {
        this.showToast('Parent suggestions could not load.', 'error');
      },
    });
  }

  loadGuardians(): void {
    this.guardiansService.getGuardians().subscribe({
      next: (guardians) => {
        this.guardians.set(guardians);
      },
      error: () => {
        this.showToast('Guardian suggestions could not load.', 'error');
      },
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.loadStudents(value);
  }

  onClassInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.classSearchTerm.set(value);
    this.showClassSuggestions.set(true);

    if (!value.trim()) {
      this.studentForm.controls.section.setValue('');
    }
  }

  onClassFocus(): void {
    const value = this.getClassDisplayValue();
    this.classSearchTerm.set(value);
    this.showClassSuggestions.set(true);
  }

  onClassBlur(): void {
    setTimeout(() => {
      this.showClassSuggestions.set(false);
    }, 160);
  }

  selectClass(schoolClass: SchoolClass): void {
    const classLabel = this.getClassLabel(schoolClass);

    this.studentForm.controls.className.setValue(schoolClass.className);
    this.studentForm.controls.section.setValue(schoolClass.section);
    this.classSearchTerm.set(classLabel);
    this.showClassSuggestions.set(false);
  }

  onGuardianInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.guardianSearchTerm.set(value);
    this.showGuardianSuggestions.set(true);
  }

  onGuardianFocus(): void {
    const value = this.studentForm.controls.guardianName.value;
    this.guardianSearchTerm.set(value);
    this.showGuardianSuggestions.set(true);
  }

  onGuardianBlur(): void {
    setTimeout(() => {
      this.showGuardianSuggestions.set(false);
    }, 160);
  }

  selectGuardian(guardian: GuardianSuggestion): void {
    this.studentForm.controls.guardianName.setValue(guardian.fullName);
    this.studentForm.controls.guardianPhone.setValue(guardian.phone);
    this.guardianSearchTerm.set(`${guardian.fullName} - ${guardian.phone}`);
    this.showGuardianSuggestions.set(false);
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
      status: 'ACTIVE',
    });

    this.studentsService.generateNextAdmissionNo().subscribe({
      next: (admissionNo) => {
        this.studentForm.controls.admissionNo.setValue(admissionNo);
      },
      error: () => {
        this.studentForm.controls.admissionNo.setValue('ADM-0001');
        this.showToast('Could not generate next admission number.', 'error');
      },
    });

    this.resetSuggestionState();
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
      status: student.status,
    });

    this.classSearchTerm.set(this.getStudentClassLabel(student));
    this.guardianSearchTerm.set(
      `${student.guardianName} - ${student.guardianPhone}`,
    );

    this.showClassSuggestions.set(false);
    this.showGuardianSuggestions.set(false);

    this.serverError.set('');
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.showCreateModal.set(false);
    this.selectedStudent.set(null);
    this.resetSuggestionState();
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
            this.showToast('Student updated successfully.', 'success');
          },
          error: (error) => {
            this.isSubmitting.set(false);
            this.serverError.set(
              error?.error?.message || 'Failed to update student.',
            );
            this.showToast('Failed to update student.', 'error');
          },
        });

      return;
    }

    this.studentsService.createStudent(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeCreateModal();
        this.loadStudents();
        this.showToast('Student added successfully.', 'success');
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.serverError.set(
          error?.error?.message || 'Failed to create student.',
        );
        this.showToast('Failed to create student.', 'error');
      },
    });
  }

  openDeleteModal(student: Student): void {
    this.studentToDelete.set(student);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.studentToDelete.set(null);
  }

  confirmDeleteStudent(): void {
    const student = this.studentToDelete();

    if (!student || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);

    this.studentsService.deleteStudent(student.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.studentToDelete.set(null);
        this.loadStudents();
        this.showToast('Student deleted successfully.', 'success');
      },
      error: (error) => {
        this.isDeleting.set(false);
        this.studentToDelete.set(null);
        this.serverError.set(
          error?.error?.message || 'Failed to delete student.',
        );
        this.showToast('Failed to delete student.', 'error');
      },
    });
  }

  getFullName(student: Student): string {
    return `${student.firstName} ${student.lastName}`.trim();
  }

  getStudentInitial(student: Student): string {
    return `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`
      .toUpperCase()
      .trim();
  }

  getClassLabel(schoolClass: SchoolClass): string {
    return `${schoolClass.className} ${schoolClass.section}`.trim();
  }

  getClassInitial(schoolClass: SchoolClass): string {
    const classInitial = schoolClass.className.charAt(0) || 'C';
    const sectionInitial = schoolClass.section.charAt(0) || '';

    return `${classInitial}${sectionInitial}`.toUpperCase();
  }

  getGuardianInitial(guardian: GuardianSuggestion): string {
    return guardian.fullName
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  getStudentClassLabel(student: Student): string {
    return `${student.className} ${student.section || ''}`.trim();
  }

  getGenderLabel(gender: StudentGender): string {
    return gender.charAt(0) + gender.slice(1).toLowerCase();
  }

  getStatusLabel(status: StudentStatus): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  isInvalid(controlName: keyof typeof this.studentForm.controls): boolean {
    const control = this.studentForm.controls[controlName];
    return control.invalid && control.touched;
  }

  private getClassDisplayValue(): string {
    const className = this.studentForm.controls.className.value;
    const section = this.studentForm.controls.section.value;

    return `${className} ${section}`.trim();
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
      status: formValue.status,
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

  private resetSuggestionState(): void {
    this.classSearchTerm.set('');
    this.guardianSearchTerm.set('');
    this.showClassSuggestions.set(false);
    this.showGuardianSuggestions.set(false);
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
