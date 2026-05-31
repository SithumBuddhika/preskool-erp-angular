import { Component, OnInit, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ClassRoom } from '../../../core/models/class-room.model';
import {
  ClassRoutine,
  ClassRoutineStatus,
  CreateClassRoutinePayload,
  RoutineDay,
} from '../../../core/models/class-routine.model';
import { SchoolClass } from '../../../core/models/school-class.model';
import { Subject } from '../../../core/models/subject.model';
import { Teacher } from '../../../core/models/teacher.model';
import { ClassRoomsService } from '../../../core/services/class-rooms.service';
import { ClassRoutinesService } from '../../../core/services/class-routines.service';
import { ClassesService } from '../../../core/services/classes.service';
import { SubjectsService } from '../../../core/services/subjects.service';
import { TeachersService } from '../../../core/services/teachers.service';

type ToastType = 'success' | 'error';

@Component({
  selector: 'app-class-routine',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './class-routine.component.html',
  styleUrl: './class-routine.component.scss',
})
export class ClassRoutineComponent implements OnInit {
  routines = signal<ClassRoutine[]>([]);
  classes = signal<SchoolClass[]>([]);
  subjects = signal<Subject[]>([]);
  teachers = signal<Teacher[]>([]);
  rooms = signal<ClassRoom[]>([]);

  selectedRoutine = signal<ClassRoutine | null>(null);
  routineToDelete = signal<ClassRoutine | null>(null);

  isLoading = signal(false);
  isSubmitting = signal(false);
  isDeleting = signal(false);
  showRoutineModal = signal(false);

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

  days: { label: string; value: RoutineDay }[] = [
    { label: 'Monday', value: 'MONDAY' },
    { label: 'Tuesday', value: 'TUESDAY' },
    { label: 'Wednesday', value: 'WEDNESDAY' },
    { label: 'Thursday', value: 'THURSDAY' },
    { label: 'Friday', value: 'FRIDAY' },
    { label: 'Saturday', value: 'SATURDAY' },
    { label: 'Sunday', value: 'SUNDAY' },
  ];

  isEditMode = computed(() => this.selectedRoutine() !== null);

  activeRoutines = computed(
    () =>
      this.routines().filter((routine) => routine.status === 'ACTIVE').length,
  );

  inactiveRoutines = computed(
    () =>
      this.routines().filter((routine) => routine.status === 'INACTIVE').length,
  );

  totalRoomsUsed = computed(() => {
    const roomNumbers = this.routines()
      .map((routine) => routine.roomNo)
      .filter(Boolean);

    return new Set(roomNumbers).size;
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

  routineForm = new FormGroup({
    routineCode: new FormControl('', {
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
    day: new FormControl<RoutineDay>('MONDAY', {
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
    status: new FormControl<ClassRoutineStatus>('ACTIVE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor(
    private readonly classRoutinesService: ClassRoutinesService,
    private readonly classesService: ClassesService,
    private readonly subjectsService: SubjectsService,
    private readonly teachersService: TeachersService,
    private readonly classRoomsService: ClassRoomsService,
  ) {}

  ngOnInit(): void {
    this.loadRoutines();
    this.loadClasses();
    this.loadSubjects();
    this.loadTeachers();
    this.loadRooms();
  }

  loadRoutines(search = this.searchTerm()): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.classRoutinesService.getClassRoutines(search).subscribe({
      next: (routines) => {
        this.routines.set(routines);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.serverError.set(
          error?.error?.message || 'Failed to load class routines.',
        );
        this.isLoading.set(false);
        this.showToast('Failed to load class routines.', 'error');
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
    this.loadRoutines(value);
  }

  onClassInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.classSearchTerm.set(value);
    this.showClassSuggestions.set(true);

    if (!value.trim()) {
      this.routineForm.controls.section.setValue('');
    }
  }

  onClassFocus(): void {
    const value = this.routineForm.controls.className.value;
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

    this.routineForm.controls.className.setValue(classLabel);
    this.routineForm.controls.section.setValue(schoolClass.section);
    this.classSearchTerm.set(classLabel);
    this.showClassSuggestions.set(false);

    if (
      schoolClass.classTeacher &&
      !this.routineForm.controls.teacherName.value
    ) {
      this.routineForm.controls.teacherName.setValue(schoolClass.classTeacher);
      this.teacherSearchTerm.set(schoolClass.classTeacher);
    }

    if (schoolClass.roomNo && !this.routineForm.controls.roomNo.value) {
      this.routineForm.controls.roomNo.setValue(schoolClass.roomNo);
      this.roomSearchTerm.set(schoolClass.roomNo);
    }
  }

  onSubjectInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.subjectSearchTerm.set(value);
    this.showSubjectSuggestions.set(true);
  }

  onSubjectFocus(): void {
    const value = this.routineForm.controls.subjectName.value;
    this.subjectSearchTerm.set(value);
    this.showSubjectSuggestions.set(true);
  }

  onSubjectBlur(): void {
    setTimeout(() => {
      this.showSubjectSuggestions.set(false);
    }, 160);
  }

  selectSubject(subject: Subject): void {
    this.routineForm.controls.subjectName.setValue(subject.subjectName);
    this.subjectSearchTerm.set(subject.subjectName);
    this.showSubjectSuggestions.set(false);

    if (subject.teacherName && !this.routineForm.controls.teacherName.value) {
      this.routineForm.controls.teacherName.setValue(subject.teacherName);
      this.teacherSearchTerm.set(subject.teacherName);
    }

    if (subject.className && !this.routineForm.controls.className.value) {
      this.routineForm.controls.className.setValue(subject.className);
      this.classSearchTerm.set(subject.className);
      this.routineForm.controls.section.setValue(
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
    const value = this.routineForm.controls.teacherName.value;
    this.teacherSearchTerm.set(value);
    this.showTeacherSuggestions.set(true);
  }

  onTeacherBlur(): void {
    setTimeout(() => {
      this.showTeacherSuggestions.set(false);
    }, 160);
  }

  selectTeacher(teacher: Teacher): void {
    this.routineForm.controls.teacherName.setValue(teacher.fullName);
    this.teacherSearchTerm.set(teacher.fullName);
    this.showTeacherSuggestions.set(false);
  }

  onRoomInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.roomSearchTerm.set(value);
    this.showRoomSuggestions.set(true);
  }

  onRoomFocus(): void {
    const value = this.routineForm.controls.roomNo.value;
    this.roomSearchTerm.set(value);
    this.showRoomSuggestions.set(true);
  }

  onRoomBlur(): void {
    setTimeout(() => {
      this.showRoomSuggestions.set(false);
    }, 160);
  }

  selectRoom(room: ClassRoom): void {
    this.routineForm.controls.roomNo.setValue(room.roomNo);
    this.roomSearchTerm.set(room.roomNo);
    this.showRoomSuggestions.set(false);
  }

  openCreateModal(): void {
    this.selectedRoutine.set(null);

    this.routineForm.reset({
      routineCode: '',
      className: '',
      section: '',
      subjectName: '',
      teacherName: '',
      roomNo: '',
      day: 'MONDAY',
      startTime: '',
      endTime: '',
      status: 'ACTIVE',
    });

    this.classRoutinesService.generateNextRoutineCode().subscribe({
      next: (routineCode) => {
        this.routineForm.controls.routineCode.setValue(routineCode);
      },
      error: () => {
        this.routineForm.controls.routineCode.setValue('RTN-0001');
        this.showToast('Could not generate next routine ID.', 'error');
      },
    });

    this.resetSuggestionState();
    this.serverError.set('');
    this.showRoutineModal.set(true);
  }

  openEditModal(routine: ClassRoutine): void {
    this.selectedRoutine.set(routine);

    this.routineForm.reset({
      routineCode: routine.routineCode,
      className: routine.className,
      section: routine.section,
      subjectName: routine.subjectName,
      teacherName: routine.teacherName,
      roomNo: routine.roomNo,
      day: routine.day,
      startTime: routine.startTime,
      endTime: routine.endTime,
      status: routine.status,
    });

    this.classSearchTerm.set(routine.className);
    this.subjectSearchTerm.set(routine.subjectName);
    this.teacherSearchTerm.set(routine.teacherName);
    this.roomSearchTerm.set(routine.roomNo);

    this.showClassSuggestions.set(false);
    this.showSubjectSuggestions.set(false);
    this.showTeacherSuggestions.set(false);
    this.showRoomSuggestions.set(false);

    this.serverError.set('');
    this.showRoutineModal.set(true);
  }

  closeRoutineModal(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.showRoutineModal.set(false);
    this.selectedRoutine.set(null);
    this.resetSuggestionState();
    this.serverError.set('');
  }

  saveRoutine(): void {
    this.routineForm.markAllAsTouched();
    this.serverError.set('');

    if (this.routineForm.invalid || this.isSubmitting()) {
      return;
    }

    const formValue = this.routineForm.getRawValue();

    if (formValue.startTime >= formValue.endTime) {
      this.serverError.set('End time must be later than start time.');
      return;
    }

    const selectedRoutine = this.selectedRoutine();
    const payload = this.buildRoutinePayload();

    this.isSubmitting.set(true);

    if (selectedRoutine) {
      this.classRoutinesService
        .updateClassRoutine(selectedRoutine.id, payload)
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.closeRoutineModal();
            this.loadRoutines();
            this.showToast('Class routine updated successfully.', 'success');
          },
          error: (error) => {
            this.isSubmitting.set(false);
            this.serverError.set(
              error?.error?.message || 'Failed to update class routine.',
            );
            this.showToast('Failed to update class routine.', 'error');
          },
        });

      return;
    }

    this.classRoutinesService.createClassRoutine(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeRoutineModal();
        this.loadRoutines();
        this.showToast('Class routine added successfully.', 'success');
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.serverError.set(
          error?.error?.message || 'Failed to create class routine.',
        );
        this.showToast('Failed to create class routine.', 'error');
      },
    });
  }

  openDeleteModal(routine: ClassRoutine): void {
    this.routineToDelete.set(routine);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.routineToDelete.set(null);
  }

  confirmDeleteRoutine(): void {
    const routine = this.routineToDelete();

    if (!routine || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);

    this.classRoutinesService.deleteClassRoutine(routine.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.routineToDelete.set(null);
        this.loadRoutines();
        this.showToast('Class routine deleted successfully.', 'success');
      },
      error: (error) => {
        this.isDeleting.set(false);
        this.routineToDelete.set(null);
        this.serverError.set(
          error?.error?.message || 'Failed to delete class routine.',
        );
        this.showToast('Failed to delete class routine.', 'error');
      },
    });
  }

  getClassLabel(schoolClass: SchoolClass): string {
    return `${schoolClass.className} ${schoolClass.section}`.trim();
  }

  getRoutineInitial(routine: ClassRoutine): string {
    return routine.className
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

  getDayLabel(day: RoutineDay): string {
    return this.days.find((item) => item.value === day)?.label || day;
  }

  getTimeRange(routine: ClassRoutine): string {
    return `${routine.startTime} - ${routine.endTime}`;
  }

  getStatusLabel(status: ClassRoutineStatus): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  isInvalid(controlName: keyof typeof this.routineForm.controls): boolean {
    const control = this.routineForm.controls[controlName];
    return control.invalid && control.touched;
  }

  private buildRoutinePayload(): CreateClassRoutinePayload {
    const formValue = this.routineForm.getRawValue();

    return {
      routineCode: formValue.routineCode.trim(),
      className: formValue.className.trim(),
      section: formValue.section.trim(),
      subjectName: formValue.subjectName.trim(),
      teacherName: formValue.teacherName.trim(),
      roomNo: formValue.roomNo.trim(),
      day: formValue.day,
      startTime: formValue.startTime,
      endTime: formValue.endTime,
      status: formValue.status,
    };
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
