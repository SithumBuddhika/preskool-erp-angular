import { Component, OnInit, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ClassRoom } from '../../../core/models/class-room.model';
import {
  CreateExamPayload,
  Exam,
  ExamStatus,
} from '../../../core/models/exam.model';
import { SchoolClass } from '../../../core/models/school-class.model';
import { Subject } from '../../../core/models/subject.model';
import { Teacher } from '../../../core/models/teacher.model';
import { ClassRoomsService } from '../../../core/services/class-rooms.service';
import { ClassesService } from '../../../core/services/classes.service';
import { ExamsService } from '../../../core/services/exams.service';
import { SubjectsService } from '../../../core/services/subjects.service';
import { TeachersService } from '../../../core/services/teachers.service';

type ToastType = 'success' | 'error';

@Component({
  selector: 'app-exams',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './exams.component.html',
  styleUrl: './exams.component.scss',
})
export class ExamsComponent implements OnInit {
  exams = signal<Exam[]>([]);
  classes = signal<SchoolClass[]>([]);
  subjects = signal<Subject[]>([]);
  teachers = signal<Teacher[]>([]);
  rooms = signal<ClassRoom[]>([]);

  selectedExam = signal<Exam | null>(null);
  examToDelete = signal<Exam | null>(null);

  isLoading = signal(false);
  isSubmitting = signal(false);
  isDeleting = signal(false);
  showExamModal = signal(false);

  serverError = signal('');
  searchTerm = signal('');

  showClassSuggestions = signal(false);
  classSearchTerm = signal('');

  showSubjectSuggestions = signal(false);
  subjectSearchTerm = signal('');

  showTeacherSuggestions = signal(false);
  teacherSearchTerm = signal('');

  showRoomSuggestions = signal(false);
  roomSearchTerm = signal('');

  toast = signal<{ message: string; type: ToastType } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  isEditMode = computed(() => this.selectedExam() !== null);

  scheduledExams = computed(
    () => this.exams().filter((exam) => exam.status === 'SCHEDULED').length,
  );

  completedExams = computed(
    () => this.exams().filter((exam) => exam.status === 'COMPLETED').length,
  );

  cancelledExams = computed(
    () => this.exams().filter((exam) => exam.status === 'CANCELLED').length,
  );

  totalSubjects = computed(() => {
    const subjectNames = this.exams()
      .map((exam) => exam.subjectName)
      .filter(Boolean);

    return new Set(subjectNames).size;
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

  filteredSubjects = computed(() => {
    const keyword = this.subjectSearchTerm().trim().toLowerCase();

    const activeSubjects = this.subjects().filter(
      (subject) => subject.status !== 'INACTIVE',
    );

    if (!keyword) {
      return activeSubjects.slice(0, 6);
    }

    return activeSubjects
      .filter((subject) => {
        const searchableText = [
          subject.subjectName,
          subject.subjectCode,
          subject.className,
          subject.teacherName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(keyword);
      })
      .slice(0, 6);
  });

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
          teacher.employeeNo,
          teacher.phone,
          teacher.subject,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(keyword);
      })
      .slice(0, 6);
  });

  filteredRooms = computed(() => {
    const keyword = this.roomSearchTerm().trim().toLowerCase();

    const activeRooms = this.rooms().filter(
      (room) => room.status !== 'INACTIVE',
    );

    if (!keyword) {
      return activeRooms.slice(0, 6);
    }

    return activeRooms
      .filter((room) => {
        const searchableText = [
          room.roomNo,
          room.roomName,
          room.building,
          room.floor,
          room.capacity,
          room.status,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(keyword);
      })
      .slice(0, 6);
  });

  examForm = new FormGroup({
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
    roomNo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    examDate: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    startTime: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    endTime: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    maxMarks: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1)],
    }),
    minMarks: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0)],
    }),
    status: new FormControl<ExamStatus>('SCHEDULED', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor(
    private readonly examsService: ExamsService,
    private readonly classesService: ClassesService,
    private readonly subjectsService: SubjectsService,
    private readonly teachersService: TeachersService,
    private readonly classRoomsService: ClassRoomsService,
  ) {}

  ngOnInit(): void {
    this.loadExams();
    this.loadClasses();
    this.loadSubjects();
    this.loadTeachers();
    this.loadRooms();
  }

  loadExams(search = this.searchTerm()): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.examsService.getExams(search).subscribe({
      next: (exams) => {
        this.exams.set(exams);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.serverError.set(
          error?.error?.message || 'Failed to load exam schedules.',
        );
        this.isLoading.set(false);
        this.showToast('Failed to load exam schedules.', 'error');
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

  loadSubjects(): void {
    this.subjectsService.getSubjects().subscribe({
      next: (subjects) => {
        this.subjects.set(subjects);
      },
      error: () => {
        this.showToast('Subject suggestions could not load.', 'error');
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

  loadRooms(): void {
    this.classRoomsService.getClassRooms().subscribe({
      next: (rooms) => {
        this.rooms.set(rooms);
      },
      error: () => {
        this.showToast('Room suggestions could not load.', 'error');
      },
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.loadExams(value);
  }

  onClassInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.classSearchTerm.set(value);
    this.showClassSuggestions.set(true);

    if (!value.trim()) {
      this.examForm.controls.section.setValue('');
    }
  }

  onClassFocus(): void {
    const value = this.examForm.controls.className.value;
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

    this.examForm.controls.className.setValue(classLabel);
    this.examForm.controls.section.setValue(schoolClass.section);
    this.classSearchTerm.set(classLabel);
    this.showClassSuggestions.set(false);

    if (schoolClass.classTeacher && !this.examForm.controls.teacherName.value) {
      this.examForm.controls.teacherName.setValue(schoolClass.classTeacher);
      this.teacherSearchTerm.set(schoolClass.classTeacher);
    }

    if (schoolClass.roomNo && !this.examForm.controls.roomNo.value) {
      this.examForm.controls.roomNo.setValue(schoolClass.roomNo);
      this.roomSearchTerm.set(schoolClass.roomNo);
    }
  }

  onSubjectInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.subjectSearchTerm.set(value);
    this.showSubjectSuggestions.set(true);
  }

  onSubjectFocus(): void {
    const value = this.examForm.controls.subjectName.value;
    this.subjectSearchTerm.set(value);
    this.showSubjectSuggestions.set(true);
  }

  onSubjectBlur(): void {
    setTimeout(() => {
      this.showSubjectSuggestions.set(false);
    }, 160);
  }

  selectSubject(subject: Subject): void {
    this.examForm.controls.subjectName.setValue(subject.subjectName);
    this.subjectSearchTerm.set(subject.subjectName);
    this.showSubjectSuggestions.set(false);

    if (subject.teacherName && !this.examForm.controls.teacherName.value) {
      this.examForm.controls.teacherName.setValue(subject.teacherName);
      this.teacherSearchTerm.set(subject.teacherName);
    }

    if (subject.className && !this.examForm.controls.className.value) {
      this.examForm.controls.className.setValue(subject.className);
      this.classSearchTerm.set(subject.className);
      this.examForm.controls.section.setValue(
        this.extractSectionFromClassName(subject.className),
      );
    }
  }

  onTeacherInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.teacherSearchTerm.set(value);
    this.showTeacherSuggestions.set(true);
  }

  onTeacherFocus(): void {
    const value = this.examForm.controls.teacherName.value;
    this.teacherSearchTerm.set(value);
    this.showTeacherSuggestions.set(true);
  }

  onTeacherBlur(): void {
    setTimeout(() => {
      this.showTeacherSuggestions.set(false);
    }, 160);
  }

  selectTeacher(teacher: Teacher): void {
    this.examForm.controls.teacherName.setValue(teacher.fullName);
    this.teacherSearchTerm.set(teacher.fullName);
    this.showTeacherSuggestions.set(false);
  }

  onRoomInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.roomSearchTerm.set(value);
    this.showRoomSuggestions.set(true);
  }

  onRoomFocus(): void {
    const value = this.examForm.controls.roomNo.value;
    this.roomSearchTerm.set(value);
    this.showRoomSuggestions.set(true);
  }

  onRoomBlur(): void {
    setTimeout(() => {
      this.showRoomSuggestions.set(false);
    }, 160);
  }

  selectRoom(room: ClassRoom): void {
    this.examForm.controls.roomNo.setValue(room.roomNo);
    this.roomSearchTerm.set(room.roomNo);
    this.showRoomSuggestions.set(false);
  }

  openCreateModal(): void {
    this.selectedExam.set(null);

    this.examForm.reset({
      examCode: '',
      examName: '',
      className: '',
      section: '',
      subjectName: '',
      teacherName: '',
      roomNo: '',
      examDate: '',
      startTime: '',
      endTime: '',
      maxMarks: null,
      minMarks: null,
      status: 'SCHEDULED',
    });

    this.examsService.generateNextExamCode().subscribe({
      next: (examCode) => {
        this.examForm.controls.examCode.setValue(examCode);
      },
      error: () => {
        this.examForm.controls.examCode.setValue('EXM-0001');
        this.showToast('Could not generate next exam ID.', 'error');
      },
    });

    this.resetSuggestionState();
    this.serverError.set('');
    this.showExamModal.set(true);
  }

  openEditModal(exam: Exam): void {
    this.selectedExam.set(exam);

    this.examForm.reset({
      examCode: exam.examCode,
      examName: exam.examName,
      className: exam.className,
      section: exam.section,
      subjectName: exam.subjectName,
      teacherName: exam.teacherName,
      roomNo: exam.roomNo,
      examDate: this.formatDateForInput(exam.examDate),
      startTime: exam.startTime,
      endTime: exam.endTime,
      maxMarks: exam.maxMarks,
      minMarks: exam.minMarks,
      status: exam.status,
    });

    this.classSearchTerm.set(exam.className);
    this.subjectSearchTerm.set(exam.subjectName);
    this.teacherSearchTerm.set(exam.teacherName);
    this.roomSearchTerm.set(exam.roomNo);

    this.showClassSuggestions.set(false);
    this.showSubjectSuggestions.set(false);
    this.showTeacherSuggestions.set(false);
    this.showRoomSuggestions.set(false);

    this.serverError.set('');
    this.showExamModal.set(true);
  }

  closeExamModal(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.showExamModal.set(false);
    this.selectedExam.set(null);
    this.resetSuggestionState();
    this.serverError.set('');
  }

  saveExam(): void {
    this.examForm.markAllAsTouched();
    this.serverError.set('');

    if (this.examForm.invalid || this.isSubmitting()) {
      return;
    }

    const formValue = this.examForm.getRawValue();

    if (formValue.startTime >= formValue.endTime) {
      this.serverError.set('End time must be later than start time.');
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

    const selectedExam = this.selectedExam();
    const payload = this.buildExamPayload();

    this.isSubmitting.set(true);

    if (selectedExam) {
      this.examsService.updateExam(selectedExam.id, payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeExamModal();
          this.loadExams();
          this.showToast('Exam schedule updated successfully.', 'success');
        },
        error: (error) => {
          this.isSubmitting.set(false);
          this.serverError.set(
            error?.error?.message || 'Failed to update exam schedule.',
          );
          this.showToast('Failed to update exam schedule.', 'error');
        },
      });

      return;
    }

    this.examsService.createExam(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeExamModal();
        this.loadExams();
        this.showToast('Exam schedule added successfully.', 'success');
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.serverError.set(
          error?.error?.message || 'Failed to create exam schedule.',
        );
        this.showToast('Failed to create exam schedule.', 'error');
      },
    });
  }

  openDeleteModal(exam: Exam): void {
    this.examToDelete.set(exam);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.examToDelete.set(null);
  }

  confirmDeleteExam(): void {
    const exam = this.examToDelete();

    if (!exam || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);

    this.examsService.deleteExam(exam.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.examToDelete.set(null);
        this.loadExams();
        this.showToast('Exam schedule deleted successfully.', 'success');
      },
      error: (error) => {
        this.isDeleting.set(false);
        this.examToDelete.set(null);
        this.serverError.set(
          error?.error?.message || 'Failed to delete exam schedule.',
        );
        this.showToast('Failed to delete exam schedule.', 'error');
      },
    });
  }

  getClassLabel(schoolClass: SchoolClass): string {
    return `${schoolClass.className} ${schoolClass.section}`.trim();
  }

  getExamInitial(exam: Exam): string {
    return exam.examName
      .split(' ')
      .map((item) => item.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  getClassInitial(schoolClass: SchoolClass): string {
    const classInitial = schoolClass.className.charAt(0) || 'C';
    const sectionInitial = schoolClass.section.charAt(0) || '';

    return `${classInitial}${sectionInitial}`.toUpperCase();
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

  getRoomInitial(room: ClassRoom): string {
    return room.roomNo
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 2)
      .toUpperCase();
  }

  getRoomLabel(room: ClassRoom): string {
    return `${room.roomNo} - ${room.roomName}`;
  }

  getRoomMeta(room: ClassRoom): string {
    const details = [
      room.building,
      room.floor,
      room.capacity ? `${room.capacity} seats` : '',
      room.status === 'MAINTENANCE' ? 'Maintenance' : '',
    ].filter(Boolean);

    return details.length ? details.join(' · ') : 'Room details not added';
  }

  getStatusLabel(status: ExamStatus): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  getDateLabel(examDate: string): string {
    const date = new Date(examDate);

    if (Number.isNaN(date.getTime())) {
      return examDate;
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  }

  getTimeRange(exam: Exam): string {
    return `${exam.startTime} - ${exam.endTime}`;
  }

  getDuration(exam: Exam): string {
    return this.calculateDuration(exam.startTime, exam.endTime);
  }

  isInvalid(controlName: keyof typeof this.examForm.controls): boolean {
    const control = this.examForm.controls[controlName];
    return control.invalid && control.touched;
  }

  private buildExamPayload(): CreateExamPayload {
    const formValue = this.examForm.getRawValue();

    return {
      examCode: formValue.examCode.trim(),
      examName: formValue.examName.trim(),
      className: formValue.className.trim(),
      section: formValue.section.trim(),
      subjectName: formValue.subjectName.trim(),
      teacherName: formValue.teacherName.trim(),
      roomNo: formValue.roomNo.trim(),
      examDate: formValue.examDate,
      startTime: formValue.startTime,
      endTime: formValue.endTime,
      maxMarks: Number(formValue.maxMarks),
      minMarks: Number(formValue.minMarks),
      status: formValue.status,
    };
  }

  private formatDateForInput(dateValue: string): string {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toISOString().slice(0, 10);
  }

  private calculateDuration(startTime: string, endTime: string): string {
    if (!startTime || !endTime || startTime >= endTime) {
      return '-';
    }

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    const durationMinutes = endTotalMinutes - startTotalMinutes;

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    if (hours && minutes) {
      return `${hours}h ${minutes}m`;
    }

    if (hours) {
      return `${hours}h`;
    }

    return `${minutes}m`;
  }

  private extractSectionFromClassName(className: string): string {
    const parts = className.trim().split(' ');
    return parts.length > 0 ? parts[parts.length - 1] : '';
  }

  private resetSuggestionState(): void {
    this.classSearchTerm.set('');
    this.subjectSearchTerm.set('');
    this.teacherSearchTerm.set('');
    this.roomSearchTerm.set('');

    this.showClassSuggestions.set(false);
    this.showSubjectSuggestions.set(false);
    this.showTeacherSuggestions.set(false);
    this.showRoomSuggestions.set(false);
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
