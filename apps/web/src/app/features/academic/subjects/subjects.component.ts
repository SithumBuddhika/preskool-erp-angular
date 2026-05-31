import { Component, OnInit, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  CreateSubjectPayload,
  Subject,
  SubjectStatus,
} from '../../../core/models/subject.model';
import { SchoolClass } from '../../../core/models/school-class.model';
import { Teacher } from '../../../core/models/teacher.model';
import { ClassesService } from '../../../core/services/classes.service';
import { SubjectsService } from '../../../core/services/subjects.service';
import { TeachersService } from '../../../core/services/teachers.service';

type ToastType = 'success' | 'error';

@Component({
  selector: 'app-subjects',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './subjects.component.html',
  styleUrl: './subjects.component.scss',
})
export class SubjectsComponent implements OnInit {
  subjects = signal<Subject[]>([]);
  teachers = signal<Teacher[]>([]);
  classes = signal<SchoolClass[]>([]);

  selectedSubject = signal<Subject | null>(null);
  subjectToDelete = signal<Subject | null>(null);

  isLoading = signal(false);
  isSubmitting = signal(false);
  isDeleting = signal(false);
  showSubjectModal = signal(false);

  showTeacherSuggestions = signal(false);
  teacherSearchTerm = signal('');

  showClassSuggestions = signal(false);
  classSearchTerm = signal('');

  serverError = signal('');
  searchTerm = signal('');

  toast = signal<{ message: string; type: ToastType } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  isEditMode = computed(() => this.selectedSubject() !== null);

  activeSubjects = computed(
    () =>
      this.subjects().filter((subject) => subject.status === 'ACTIVE').length,
  );

  inactiveSubjects = computed(
    () =>
      this.subjects().filter((subject) => subject.status === 'INACTIVE').length,
  );

  totalWeeklyHours = computed(() =>
    this.subjects().reduce(
      (total, subject) => total + (subject.weeklyHours || 0),
      0,
    ),
  );

  filteredTeachers = computed(() => {
    const keyword = this.teacherSearchTerm().trim().toLowerCase();

    const activeTeachers = this.teachers().filter(
      (teacher) => teacher.status !== 'INACTIVE',
    );

    if (!keyword) {
      return activeTeachers.slice(0, 6);
    }

    return activeTeachers
      .filter((teacher) => {
        const searchableText = [
          teacher.fullName,
          teacher.email,
          teacher.subject,
          teacher.employeeNo,
          teacher.phone,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(keyword);
      })
      .slice(0, 6);
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

  subjectForm = new FormGroup({
    subjectCode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    subjectName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    className: new FormControl('', {
      nonNullable: true,
    }),
    teacherName: new FormControl('', {
      nonNullable: true,
    }),
    weeklyHours: new FormControl<number | null>(null, {
      validators: [Validators.min(1)],
    }),
    status: new FormControl<SubjectStatus>('ACTIVE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor(
    private readonly subjectsService: SubjectsService,
    private readonly teachersService: TeachersService,
    private readonly classesService: ClassesService,
  ) {}

  ngOnInit(): void {
    this.loadSubjects();
    this.loadTeachers();
    this.loadClasses();
  }

  loadSubjects(search = this.searchTerm()): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.subjectsService.getSubjects(search).subscribe({
      next: (subjects) => {
        this.subjects.set(subjects);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.serverError.set(
          error?.error?.message || 'Failed to load subjects.',
        );
        this.isLoading.set(false);
        this.showToast('Failed to load subjects.', 'error');
      },
    });
  }

  loadTeachers(): void {
    this.teachersService.getTeachers().subscribe({
      next: (teachers) => {
        this.teachers.set(teachers);
      },
      error: () => {
        this.showToast(
          'Teacher suggestions could not load. Check people-service.',
          'error',
        );
      },
    });
  }

  loadClasses(): void {
    this.classesService.getClasses().subscribe({
      next: (classes) => {
        this.classes.set(classes);
      },
      error: () => {
        this.showToast(
          'Class suggestions could not load. Check academic-service.',
          'error',
        );
      },
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.loadSubjects(value);
  }

  onTeacherInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.teacherSearchTerm.set(value);
    this.showTeacherSuggestions.set(true);
  }

  onTeacherFocus(): void {
    const value = this.subjectForm.controls.teacherName.value;
    this.teacherSearchTerm.set(value);
    this.showTeacherSuggestions.set(true);
  }

  onTeacherBlur(): void {
    setTimeout(() => {
      this.showTeacherSuggestions.set(false);
    }, 160);
  }

  selectTeacher(teacher: Teacher): void {
    this.subjectForm.controls.teacherName.setValue(teacher.fullName);
    this.teacherSearchTerm.set(teacher.fullName);
    this.showTeacherSuggestions.set(false);
  }

  onClassInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.classSearchTerm.set(value);
    this.showClassSuggestions.set(true);
  }

  onClassFocus(): void {
    const value = this.subjectForm.controls.className.value;
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

    this.subjectForm.controls.className.setValue(classLabel);
    this.classSearchTerm.set(classLabel);
    this.showClassSuggestions.set(false);
  }

  openCreateModal(): void {
    this.selectedSubject.set(null);

    this.subjectForm.reset({
      subjectCode: '',
      subjectName: '',
      className: '',
      teacherName: '',
      weeklyHours: null,
      status: 'ACTIVE',
    });

    this.teacherSearchTerm.set('');
    this.classSearchTerm.set('');
    this.showTeacherSuggestions.set(false);
    this.showClassSuggestions.set(false);
    this.serverError.set('');
    this.showSubjectModal.set(true);
  }

  openEditModal(subject: Subject): void {
    this.selectedSubject.set(subject);

    this.subjectForm.reset({
      subjectCode: subject.subjectCode,
      subjectName: subject.subjectName,
      className: subject.className || '',
      teacherName: subject.teacherName || '',
      weeklyHours: subject.weeklyHours || null,
      status: subject.status,
    });

    this.teacherSearchTerm.set(subject.teacherName || '');
    this.classSearchTerm.set(subject.className || '');
    this.showTeacherSuggestions.set(false);
    this.showClassSuggestions.set(false);
    this.serverError.set('');
    this.showSubjectModal.set(true);
  }

  closeSubjectModal(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.showSubjectModal.set(false);
    this.selectedSubject.set(null);
    this.teacherSearchTerm.set('');
    this.classSearchTerm.set('');
    this.showTeacherSuggestions.set(false);
    this.showClassSuggestions.set(false);
    this.serverError.set('');
  }

  saveSubject(): void {
    this.subjectForm.markAllAsTouched();
    this.serverError.set('');

    if (this.subjectForm.invalid || this.isSubmitting()) {
      return;
    }

    const selectedSubject = this.selectedSubject();
    const payload = this.buildSubjectPayload();

    this.isSubmitting.set(true);

    if (selectedSubject) {
      this.subjectsService
        .updateSubject(selectedSubject.id, payload)
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.closeSubjectModal();
            this.loadSubjects();
            this.showToast('Subject updated successfully.', 'success');
          },
          error: (error) => {
            this.isSubmitting.set(false);
            this.serverError.set(
              error?.error?.message || 'Failed to update subject.',
            );
            this.showToast('Failed to update subject.', 'error');
          },
        });

      return;
    }

    this.subjectsService.createSubject(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeSubjectModal();
        this.loadSubjects();
        this.showToast('Subject added successfully.', 'success');
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.serverError.set(
          error?.error?.message || 'Failed to create subject.',
        );
        this.showToast('Failed to create subject.', 'error');
      },
    });
  }

  openDeleteModal(subject: Subject): void {
    this.subjectToDelete.set(subject);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.subjectToDelete.set(null);
  }

  confirmDeleteSubject(): void {
    const subject = this.subjectToDelete();

    if (!subject || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);

    this.subjectsService.deleteSubject(subject.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.subjectToDelete.set(null);
        this.loadSubjects();
        this.showToast('Subject deleted successfully.', 'success');
      },
      error: (error) => {
        this.isDeleting.set(false);
        this.subjectToDelete.set(null);
        this.serverError.set(
          error?.error?.message || 'Failed to delete subject.',
        );
        this.showToast('Failed to delete subject.', 'error');
      },
    });
  }

  getSubjectInitial(subject: Subject): string {
    return subject.subjectName.charAt(0).toUpperCase();
  }

  getTeacherInitial(teacher: Teacher): string {
    return teacher.fullName
      .split(' ')
      .map((name) => name.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  getClassInitial(schoolClass: SchoolClass): string {
    const classInitial = schoolClass.className.charAt(0) || 'C';
    const sectionInitial = schoolClass.section.charAt(0) || '';

    return `${classInitial}${sectionInitial}`.toUpperCase();
  }

  getClassLabel(schoolClass: SchoolClass): string {
    return `${schoolClass.className} ${schoolClass.section}`.trim();
  }

  getStatusLabel(status: SubjectStatus): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  getSaveButtonLabel(): string {
    if (this.isSubmitting()) {
      return this.isEditMode() ? 'Updating...' : 'Saving...';
    }

    return this.isEditMode() ? 'Update Subject' : 'Save Subject';
  }

  isInvalid(controlName: keyof typeof this.subjectForm.controls): boolean {
    const control = this.subjectForm.controls[controlName];
    return control.invalid && control.touched;
  }

  private buildSubjectPayload(): CreateSubjectPayload {
    const formValue = this.subjectForm.getRawValue();

    const payload: CreateSubjectPayload = {
      subjectCode: formValue.subjectCode.trim(),
      subjectName: formValue.subjectName.trim(),
      status: formValue.status,
    };

    if (formValue.className.trim()) {
      payload.className = formValue.className.trim();
    }

    if (formValue.teacherName.trim()) {
      payload.teacherName = formValue.teacherName.trim();
    }

    if (formValue.weeklyHours !== null && formValue.weeklyHours !== undefined) {
      payload.weeklyHours = Number(formValue.weeklyHours);
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
