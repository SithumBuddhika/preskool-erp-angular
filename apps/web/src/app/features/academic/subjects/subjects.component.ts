import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface Teacher {
  id: number;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
}

interface ClassItem {
  id: number;
  className?: string;
  name?: string;
  grade?: string;
  section?: string;
}

interface Subject {
  id: number;
  subjectName: string;
  subjectCode: string;
  description?: string;
  status?: string;

  teacherId?: number;
  classId?: number;

  teacher?: Teacher;
  class?: ClassItem;
  schoolClass?: ClassItem;
}

@Component({
  selector: 'app-subjects',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './subjects.component.html',
  styleUrls: ['./subjects.component.scss'],
})
export class SubjectsComponent implements OnInit {
  private readonly apiBaseUrl = 'http://localhost:3000/api';

  subjectForm!: FormGroup;

  subjects: Subject[] = [];
  teachers: Teacher[] = [];
  classes: ClassItem[] = [];

  filteredTeachers: Teacher[] = [];
  filteredClasses: ClassItem[] = [];

  selectedTeacher: Teacher | null = null;
  selectedClass: ClassItem | null = null;

  showTeacherSuggestions = false;
  showClassSuggestions = false;

  isLoading = false;
  isSubmitting = false;
  isEditMode = false;
  editingSubjectId: number | null = null;

  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private elementRef: ElementRef,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadInitialData();

    this.subjectForm.get('teacherSearch')?.valueChanges.subscribe((value) => {
      this.filterTeachers(value || '');
    });

    this.subjectForm.get('classSearch')?.valueChanges.subscribe((value) => {
      this.filterClasses(value || '');
    });
  }

  private initForm(): void {
    this.subjectForm = this.fb.group({
      subjectName: ['', [Validators.required, Validators.minLength(2)]],
      subjectCode: ['', [Validators.required, Validators.minLength(2)]],
      teacherSearch: ['', Validators.required],
      teacherId: [null, Validators.required],
      classSearch: ['', Validators.required],
      classId: [null, Validators.required],
      description: [''],
      status: ['Active', Validators.required],
    });
  }

  private loadInitialData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    Promise.all([
      this.http.get<Subject[]>(`${this.apiBaseUrl}/subjects`).toPromise(),
      this.http.get<Teacher[]>(`${this.apiBaseUrl}/teachers`).toPromise(),
      this.http.get<ClassItem[]>(`${this.apiBaseUrl}/classes`).toPromise(),
    ])
      .then(([subjects, teachers, classes]) => {
        this.subjects = subjects || [];
        this.teachers = teachers || [];
        this.classes = classes || [];

        this.filteredTeachers = this.teachers;
        this.filteredClasses = this.classes;
      })
      .catch(() => {
        this.errorMessage =
          'Failed to load subjects data. Please check backend connection.';
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  filterTeachers(searchText: string): void {
    const value = searchText.toLowerCase().trim();

    this.showTeacherSuggestions = true;

    if (!value) {
      this.filteredTeachers = this.teachers;
      this.selectedTeacher = null;
      this.subjectForm.patchValue({ teacherId: null }, { emitEvent: false });
      return;
    }

    this.filteredTeachers = this.teachers.filter((teacher) =>
      this.getTeacherName(teacher).toLowerCase().includes(value),
    );

    if (
      this.selectedTeacher &&
      this.getTeacherName(this.selectedTeacher).toLowerCase() !== value
    ) {
      this.selectedTeacher = null;
      this.subjectForm.patchValue({ teacherId: null }, { emitEvent: false });
    }
  }

  filterClasses(searchText: string): void {
    const value = searchText.toLowerCase().trim();

    this.showClassSuggestions = true;

    if (!value) {
      this.filteredClasses = this.classes;
      this.selectedClass = null;
      this.subjectForm.patchValue({ classId: null }, { emitEvent: false });
      return;
    }

    this.filteredClasses = this.classes.filter((classItem) =>
      this.getClassName(classItem).toLowerCase().includes(value),
    );

    if (
      this.selectedClass &&
      this.getClassName(this.selectedClass).toLowerCase() !== value
    ) {
      this.selectedClass = null;
      this.subjectForm.patchValue({ classId: null }, { emitEvent: false });
    }
  }

  selectTeacher(teacher: Teacher): void {
    this.selectedTeacher = teacher;

    this.subjectForm.patchValue(
      {
        teacherSearch: this.getTeacherName(teacher),
        teacherId: teacher.id,
      },
      { emitEvent: false },
    );

    this.showTeacherSuggestions = false;
  }

  selectClass(classItem: ClassItem): void {
    this.selectedClass = classItem;

    this.subjectForm.patchValue(
      {
        classSearch: this.getClassName(classItem),
        classId: classItem.id,
      },
      { emitEvent: false },
    );

    this.showClassSuggestions = false;
  }

  clearTeacher(): void {
    this.selectedTeacher = null;
    this.subjectForm.patchValue({
      teacherSearch: '',
      teacherId: null,
    });
    this.filteredTeachers = this.teachers;
  }

  clearClass(): void {
    this.selectedClass = null;
    this.subjectForm.patchValue({
      classSearch: '',
      classId: null,
    });
    this.filteredClasses = this.classes;
  }

  submitSubject(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.subjectForm.invalid) {
      this.subjectForm.markAllAsTouched();
      this.errorMessage = 'Please fill all required fields correctly.';
      return;
    }

    if (!this.subjectForm.value.teacherId) {
      this.errorMessage = 'Please select a teacher from the suggestions list.';
      return;
    }

    if (!this.subjectForm.value.classId) {
      this.errorMessage = 'Please select a class from the suggestions list.';
      return;
    }

    const payload = {
      subjectName: this.subjectForm.value.subjectName.trim(),
      subjectCode: this.subjectForm.value.subjectCode.trim(),
      teacherId: Number(this.subjectForm.value.teacherId),
      classId: Number(this.subjectForm.value.classId),
      description: this.subjectForm.value.description?.trim() || '',
      status: this.subjectForm.value.status,
    };

    this.isSubmitting = true;

    const request =
      this.isEditMode && this.editingSubjectId
        ? this.http.put<Subject>(
            `${this.apiBaseUrl}/subjects/${this.editingSubjectId}`,
            payload,
          )
        : this.http.post<Subject>(`${this.apiBaseUrl}/subjects`, payload);

    request.subscribe({
      next: () => {
        this.successMessage = this.isEditMode
          ? 'Subject updated successfully.'
          : 'Subject added successfully.';

        this.resetForm();
        this.loadInitialData();
      },
      error: () => {
        this.errorMessage = this.isEditMode
          ? 'Failed to update subject.'
          : 'Failed to add subject.';
      },
      complete: () => {
        this.isSubmitting = false;
      },
    });
  }

  editSubject(subject: Subject): void {
    this.isEditMode = true;
    this.editingSubjectId = subject.id;

    const teacher =
      subject.teacher ||
      this.teachers.find((t) => t.id === subject.teacherId) ||
      null;

    const classItem =
      subject.class ||
      subject.schoolClass ||
      this.classes.find((c) => c.id === subject.classId) ||
      null;

    this.selectedTeacher = teacher;
    this.selectedClass = classItem;

    this.subjectForm.patchValue({
      subjectName: subject.subjectName,
      subjectCode: subject.subjectCode,
      teacherSearch: teacher ? this.getTeacherName(teacher) : '',
      teacherId: teacher?.id || subject.teacherId || null,
      classSearch: classItem ? this.getClassName(classItem) : '',
      classId: classItem?.id || subject.classId || null,
      description: subject.description || '',
      status: subject.status || 'Active',
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteSubject(subjectId: number): void {
    const confirmDelete = confirm(
      'Are you sure you want to delete this subject?',
    );

    if (!confirmDelete) return;

    this.http.delete(`${this.apiBaseUrl}/subjects/${subjectId}`).subscribe({
      next: () => {
        this.successMessage = 'Subject deleted successfully.';
        this.loadInitialData();
      },
      error: () => {
        this.errorMessage = 'Failed to delete subject.';
      },
    });
  }

  resetForm(): void {
    this.subjectForm.reset({
      subjectName: '',
      subjectCode: '',
      teacherSearch: '',
      teacherId: null,
      classSearch: '',
      classId: null,
      description: '',
      status: 'Active',
    });

    this.selectedTeacher = null;
    this.selectedClass = null;
    this.filteredTeachers = this.teachers;
    this.filteredClasses = this.classes;

    this.showTeacherSuggestions = false;
    this.showClassSuggestions = false;

    this.isEditMode = false;
    this.editingSubjectId = null;
  }

  getTeacherName(teacher?: Teacher | null): string {
    if (!teacher) return 'Not assigned';

    if (teacher.name) return teacher.name;

    const fullName =
      `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim();

    return fullName || 'Unnamed Teacher';
  }

  getClassName(classItem?: ClassItem | null): string {
    if (!classItem) return 'Not assigned';

    if (classItem.className) return classItem.className;
    if (classItem.name) return classItem.name;

    const gradeSection =
      `${classItem.grade || ''} ${classItem.section || ''}`.trim();

    return gradeSection || 'Unnamed Class';
  }

  getSubjectClass(subject: Subject): string {
    return this.getClassName(subject.class || subject.schoolClass);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.subjectForm.get(fieldName);
    return !!field && field.invalid && (field.dirty || field.touched);
  }

  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: MouseEvent): void {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);

    if (!clickedInside) {
      this.showTeacherSuggestions = false;
      this.showClassSuggestions = false;
    }
  }
}
