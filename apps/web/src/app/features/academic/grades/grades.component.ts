import { Component, OnInit, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Exam } from '../../../core/models/exam.model';
import {
  CreateGradePayload,
  Grade,
  GradeStatus,
} from '../../../core/models/grade.model';
import { Student } from '../../../core/models/student.model';
import { ExamsService } from '../../../core/services/exams.service';
import { GradesService } from '../../../core/services/grades.service';
import { StudentsService } from '../../../core/services/students.service';

type ToastType = 'success' | 'error';

@Component({
  selector: 'app-grades',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './grades.component.html',
  styleUrl: './grades.component.scss',
})
export class GradesComponent implements OnInit {
  grades = signal<Grade[]>([]);
  exams = signal<Exam[]>([]);
  students = signal<Student[]>([]);

  selectedGrade = signal<Grade | null>(null);
  gradeToDelete = signal<Grade | null>(null);

  isLoading = signal(false);
  isSubmitting = signal(false);
  isDeleting = signal(false);
  showGradeModal = signal(false);

  serverError = signal('');
  searchTerm = signal('');

  showExamSuggestions = signal(false);
  examSearchTerm = signal('');

  showStudentSuggestions = signal(false);
  studentSearchTerm = signal('');

  toast = signal<{ message: string; type: ToastType } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  isEditMode = computed(() => this.selectedGrade() !== null);

  publishedGrades = computed(
    () => this.grades().filter((grade) => grade.status === 'PUBLISHED').length,
  );

  draftGrades = computed(
    () => this.grades().filter((grade) => grade.status === 'DRAFT').length,
  );

  passGrades = computed(
    () => this.grades().filter((grade) => grade.result === 'PASS').length,
  );

  failGrades = computed(
    () => this.grades().filter((grade) => grade.result === 'FAIL').length,
  );

  filteredExams = computed(() => {
    const keyword = this.examSearchTerm().trim().toLowerCase();

    const exams = this.exams().filter((exam) => exam.status !== 'CANCELLED');

    if (!keyword) {
      return exams.slice(0, 6);
    }

    return exams
      .filter((exam) => {
        const searchableText = [
          exam.examCode,
          exam.examName,
          exam.className,
          exam.section,
          exam.subjectName,
          exam.teacherName,
          exam.roomNo,
          exam.status,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(keyword);
      })
      .slice(0, 6);
  });

  filteredStudents = computed(() => {
    const keyword = this.studentSearchTerm().trim().toLowerCase();

    if (!keyword) {
      return this.students().slice(0, 6);
    }

    return this.students()
      .filter((student) => {
        const searchableText = [
          student.admissionNo,
          student.firstName,
          student.lastName,
          student.className,
          student.section,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(keyword);
      })
      .slice(0, 6);
  });

  gradeForm = new FormGroup({
    gradeCode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    examCode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    examName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    className: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    section: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    subjectName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    teacherName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    admissionNo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    studentName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    marksObtained: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0)],
    }),
    maxMarks: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1)],
    }),
    minMarks: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0)],
    }),
    status: new FormControl<GradeStatus>('DRAFT', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor(
    private readonly gradesService: GradesService,
    private readonly examsService: ExamsService,
    private readonly studentsService: StudentsService,
  ) {}

  ngOnInit(): void {
    this.loadGrades();
    this.loadExams();
    this.loadStudents();
  }

  loadGrades(search = this.searchTerm()): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.gradesService.getGrades(search).subscribe({
      next: (grades) => {
        this.grades.set(grades);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.serverError.set(
          error?.error?.message || 'Failed to load grade records.',
        );
        this.isLoading.set(false);
        this.showToast('Failed to load grade records.', 'error');
      },
    });
  }

  loadExams(): void {
    this.examsService.getExams().subscribe({
      next: (exams) => {
        this.exams.set(exams);
      },
      error: () => {
        this.showToast('Exam suggestions could not load.', 'error');
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
    this.loadGrades(value);
  }

  onExamInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.examSearchTerm.set(value);
    this.showExamSuggestions.set(true);
  }

  onExamFocus(): void {
    const value = this.gradeForm.controls.examName.value;
    this.examSearchTerm.set(value);
    this.showExamSuggestions.set(true);
  }

  onExamBlur(): void {
    setTimeout(() => {
      this.showExamSuggestions.set(false);
    }, 160);
  }

  selectExam(exam: Exam): void {
    const examLabel = `${exam.examCode} - ${exam.examName}`;

    this.gradeForm.patchValue({
      examCode: exam.examCode,
      examName: exam.examName,
      className: exam.className,
      section: exam.section,
      subjectName: exam.subjectName,
      teacherName: exam.teacherName,
      maxMarks: exam.maxMarks,
      minMarks: exam.minMarks,
    });

    this.examSearchTerm.set(examLabel);
    this.showExamSuggestions.set(false);
  }

  onStudentInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.studentSearchTerm.set(value);
    this.showStudentSuggestions.set(true);
  }

  onStudentFocus(): void {
    const value = this.gradeForm.controls.studentName.value;
    this.studentSearchTerm.set(value);
    this.showStudentSuggestions.set(true);
  }

  onStudentBlur(): void {
    setTimeout(() => {
      this.showStudentSuggestions.set(false);
    }, 160);
  }

  selectStudent(student: Student): void {
    const studentName = this.getStudentName(student);
    const studentLabel = `${student.admissionNo} - ${studentName}`;

    this.gradeForm.patchValue({
      admissionNo: student.admissionNo,
      studentName,
    });

    this.studentSearchTerm.set(studentLabel);
    this.showStudentSuggestions.set(false);
  }

  openCreateModal(): void {
    this.selectedGrade.set(null);

    this.gradeForm.reset({
      gradeCode: '',
      examCode: '',
      examName: '',
      className: '',
      section: '',
      subjectName: '',
      teacherName: '',
      admissionNo: '',
      studentName: '',
      marksObtained: null,
      maxMarks: null,
      minMarks: null,
      status: 'DRAFT',
    });

    this.gradesService.generateNextGradeCode().subscribe({
      next: (gradeCode) => {
        this.gradeForm.controls.gradeCode.setValue(gradeCode);
      },
      error: () => {
        this.gradeForm.controls.gradeCode.setValue('GRD-0001');
        this.showToast('Could not generate next grade ID.', 'error');
      },
    });

    this.resetSuggestionState();
    this.serverError.set('');
    this.showGradeModal.set(true);
  }

  openEditModal(grade: Grade): void {
    this.selectedGrade.set(grade);

    this.gradeForm.reset({
      gradeCode: grade.gradeCode,
      examCode: grade.examCode,
      examName: grade.examName,
      className: grade.className,
      section: grade.section,
      subjectName: grade.subjectName,
      teacherName: grade.teacherName,
      admissionNo: grade.admissionNo,
      studentName: grade.studentName,
      marksObtained: grade.marksObtained,
      maxMarks: grade.maxMarks,
      minMarks: grade.minMarks,
      status: grade.status,
    });

    this.examSearchTerm.set(`${grade.examCode} - ${grade.examName}`);
    this.studentSearchTerm.set(`${grade.admissionNo} - ${grade.studentName}`);

    this.showExamSuggestions.set(false);
    this.showStudentSuggestions.set(false);

    this.serverError.set('');
    this.showGradeModal.set(true);
  }

  closeGradeModal(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.showGradeModal.set(false);
    this.selectedGrade.set(null);
    this.resetSuggestionState();
    this.serverError.set('');
  }

  saveGrade(): void {
    this.gradeForm.markAllAsTouched();
    this.serverError.set('');

    if (this.gradeForm.invalid || this.isSubmitting()) {
      return;
    }

    const formValue = this.gradeForm.getRawValue();

    if (
      formValue.marksObtained !== null &&
      formValue.maxMarks !== null &&
      formValue.marksObtained > formValue.maxMarks
    ) {
      this.serverError.set('Marks obtained cannot exceed maximum marks.');
      return;
    }

    if (
      formValue.minMarks !== null &&
      formValue.maxMarks !== null &&
      formValue.minMarks > formValue.maxMarks
    ) {
      this.serverError.set('Minimum marks cannot exceed maximum marks.');
      return;
    }

    const selectedGrade = this.selectedGrade();
    const payload = this.buildGradePayload();

    this.isSubmitting.set(true);

    if (selectedGrade) {
      this.gradesService.updateGrade(selectedGrade.id, payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeGradeModal();
          this.loadGrades();
          this.showToast('Grade record updated successfully.', 'success');
        },
        error: (error) => {
          this.isSubmitting.set(false);
          this.serverError.set(
            error?.error?.message || 'Failed to update grade record.',
          );
          this.showToast('Failed to update grade record.', 'error');
        },
      });

      return;
    }

    this.gradesService.createGrade(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeGradeModal();
        this.loadGrades();
        this.showToast('Grade record added successfully.', 'success');
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.serverError.set(
          error?.error?.message || 'Failed to create grade record.',
        );
        this.showToast('Failed to create grade record.', 'error');
      },
    });
  }

  openDeleteModal(grade: Grade): void {
    this.gradeToDelete.set(grade);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.gradeToDelete.set(null);
  }

  confirmDeleteGrade(): void {
    const grade = this.gradeToDelete();

    if (!grade || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);

    this.gradesService.deleteGrade(grade.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.gradeToDelete.set(null);
        this.loadGrades();
        this.showToast('Grade record deleted successfully.', 'success');
      },
      error: (error) => {
        this.isDeleting.set(false);
        this.gradeToDelete.set(null);
        this.serverError.set(
          error?.error?.message || 'Failed to delete grade record.',
        );
        this.showToast('Failed to delete grade record.', 'error');
      },
    });
  }

  getStudentName(student: Student): string {
    return `${student.firstName} ${student.lastName}`.trim();
  }

  getStudentInitial(student: Student): string {
    return `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`
      .toUpperCase()
      .trim();
  }

  getGradeInitial(grade: Grade): string {
    return grade.studentName
      .split(' ')
      .map((item) => item.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  getResultPreview(): string {
    const marksObtained = this.gradeForm.controls.marksObtained.value;
    const minMarks = this.gradeForm.controls.minMarks.value;

    if (marksObtained === null || minMarks === null) {
      return '-';
    }

    return marksObtained >= minMarks ? 'PASS' : 'FAIL';
  }

  getGradeLetterPreview(): string {
    const marksObtained = this.gradeForm.controls.marksObtained.value;
    const maxMarks = this.gradeForm.controls.maxMarks.value;

    if (marksObtained === null || maxMarks === null || maxMarks <= 0) {
      return '-';
    }

    const percentage = (marksObtained / maxMarks) * 100;

    if (percentage >= 75) return 'A';
    if (percentage >= 65) return 'B';
    if (percentage >= 55) return 'C';
    if (percentage >= 40) return 'S';

    return 'F';
  }

  getPercentage(grade: Grade): string {
    if (!grade.maxMarks) {
      return '0%';
    }

    const percentage = (grade.marksObtained / grade.maxMarks) * 100;

    return `${percentage.toFixed(0)}%`;
  }

  getResultLabel(result: string): string {
    return result.charAt(0) + result.slice(1).toLowerCase();
  }

  getStatusLabel(status: GradeStatus): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  isInvalid(controlName: keyof typeof this.gradeForm.controls): boolean {
    const control = this.gradeForm.controls[controlName];
    return control.invalid && control.touched;
  }

  private buildGradePayload(): CreateGradePayload {
    const formValue = this.gradeForm.getRawValue();

    return {
      gradeCode: formValue.gradeCode.trim(),
      examCode: formValue.examCode.trim(),
      examName: formValue.examName.trim(),
      className: formValue.className.trim(),
      section: formValue.section.trim(),
      subjectName: formValue.subjectName.trim(),
      teacherName: formValue.teacherName.trim(),
      admissionNo: formValue.admissionNo.trim(),
      studentName: formValue.studentName.trim(),
      marksObtained: Number(formValue.marksObtained),
      maxMarks: Number(formValue.maxMarks),
      minMarks: Number(formValue.minMarks),
      status: formValue.status,
    };
  }

  private resetSuggestionState(): void {
    this.examSearchTerm.set('');
    this.studentSearchTerm.set('');

    this.showExamSuggestions.set(false);
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
