import { Component, OnInit, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  ClassStatus,
  CreateClassPayload,
  SchoolClass,
} from '../../../core/models/school-class.model';
import { ClassRoom } from '../../../core/models/class-room.model';
import { Teacher } from '../../../core/models/teacher.model';
import { ClassesService } from '../../../core/services/classes.service';
import { ClassRoomsService } from '../../../core/services/class-rooms.service';
import { TeachersService } from '../../../core/services/teachers.service';

type ToastType = 'success' | 'error';

@Component({
  selector: 'app-classes',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './classes.component.html',
  styleUrl: './classes.component.scss',
})
export class ClassesComponent implements OnInit {
  classes = signal<SchoolClass[]>([]);
  teachers = signal<Teacher[]>([]);
  classRooms = signal<ClassRoom[]>([]);

  selectedClass = signal<SchoolClass | null>(null);
  classToDelete = signal<SchoolClass | null>(null);

  isLoading = signal(false);
  isSubmitting = signal(false);
  isDeleting = signal(false);
  showClassModal = signal(false);
  serverError = signal('');
  searchTerm = signal('');

  showTeacherSuggestions = signal(false);
  teacherSearchTerm = signal('');

  showRoomSuggestions = signal(false);
  roomSearchTerm = signal('');

  toast = signal<{ message: string; type: ToastType } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  isEditMode = computed(() => this.selectedClass() !== null);

  activeClasses = computed(
    () => this.classes().filter((item) => item.status === 'ACTIVE').length,
  );

  inactiveClasses = computed(
    () => this.classes().filter((item) => item.status !== 'ACTIVE').length,
  );

  totalCapacity = computed(() =>
    this.classes().reduce((total, item) => total + (item.capacity || 0), 0),
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

    const availableRooms = this.classRooms().filter(
      (room) => room.status !== 'INACTIVE',
    );

    if (!keyword) {
      return availableRooms.slice(0, 6);
    }

    return availableRooms
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

  classForm = new FormGroup({
    className: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    section: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    classTeacher: new FormControl('', {
      nonNullable: true,
    }),
    roomNo: new FormControl('', {
      nonNullable: true,
    }),
    capacity: new FormControl<number | null>(null, {
      validators: [Validators.min(1)],
    }),
    status: new FormControl<ClassStatus>('ACTIVE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor(
    private readonly classesService: ClassesService,
    private readonly teachersService: TeachersService,
    private readonly classRoomsService: ClassRoomsService,
  ) {}

  ngOnInit(): void {
    this.loadClasses();
    this.loadTeachers();
    this.loadClassRooms();
  }

  loadClasses(search = this.searchTerm()): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.classesService.getClasses(search).subscribe({
      next: (classes) => {
        this.classes.set(classes);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.serverError.set(
          error?.error?.message || 'Failed to load classes.',
        );
        this.isLoading.set(false);
        this.showToast('Failed to load classes.', 'error');
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

  loadClassRooms(): void {
    this.classRoomsService.getClassRooms().subscribe({
      next: (classRooms) => {
        this.classRooms.set(classRooms);
      },
      error: () => {
        this.showToast(
          'Room suggestions could not load. Check academic-service.',
          'error',
        );
      },
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.loadClasses(value);
  }

  onTeacherInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.teacherSearchTerm.set(value);
    this.showTeacherSuggestions.set(true);
  }

  onTeacherFocus(): void {
    const value = this.classForm.controls.classTeacher.value;
    this.teacherSearchTerm.set(value);
    this.showTeacherSuggestions.set(true);
  }

  onTeacherBlur(): void {
    setTimeout(() => {
      this.showTeacherSuggestions.set(false);
    }, 160);
  }

  selectTeacher(teacher: Teacher): void {
    this.classForm.controls.classTeacher.setValue(teacher.fullName);
    this.teacherSearchTerm.set(teacher.fullName);
    this.showTeacherSuggestions.set(false);
  }

  onRoomInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.roomSearchTerm.set(value);
    this.showRoomSuggestions.set(true);
  }

  onRoomFocus(): void {
    const value = this.classForm.controls.roomNo.value;
    this.roomSearchTerm.set(value);
    this.showRoomSuggestions.set(true);
  }

  onRoomBlur(): void {
    setTimeout(() => {
      this.showRoomSuggestions.set(false);
    }, 160);
  }

  selectRoom(room: ClassRoom): void {
    this.classForm.controls.roomNo.setValue(room.roomNo);
    this.roomSearchTerm.set(room.roomNo);
    this.showRoomSuggestions.set(false);

    const currentCapacity = this.classForm.controls.capacity.value;

    if (
      room.capacity !== null &&
      room.capacity !== undefined &&
      (!currentCapacity || currentCapacity <= 0)
    ) {
      this.classForm.controls.capacity.setValue(Number(room.capacity));
    }
  }

  openCreateModal(): void {
    this.selectedClass.set(null);

    this.classForm.reset({
      className: '',
      section: '',
      classTeacher: '',
      roomNo: '',
      capacity: null,
      status: 'ACTIVE',
    });

    this.teacherSearchTerm.set('');
    this.roomSearchTerm.set('');
    this.showTeacherSuggestions.set(false);
    this.showRoomSuggestions.set(false);

    this.serverError.set('');
    this.showClassModal.set(true);
  }

  openEditModal(schoolClass: SchoolClass): void {
    this.selectedClass.set(schoolClass);

    this.classForm.reset({
      className: schoolClass.className,
      section: schoolClass.section,
      classTeacher: schoolClass.classTeacher || '',
      roomNo: schoolClass.roomNo || '',
      capacity: schoolClass.capacity || null,
      status: schoolClass.status,
    });

    this.teacherSearchTerm.set(schoolClass.classTeacher || '');
    this.roomSearchTerm.set(schoolClass.roomNo || '');
    this.showTeacherSuggestions.set(false);
    this.showRoomSuggestions.set(false);

    this.serverError.set('');
    this.showClassModal.set(true);
  }

  closeClassModal(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.showClassModal.set(false);
    this.selectedClass.set(null);

    this.teacherSearchTerm.set('');
    this.roomSearchTerm.set('');
    this.showTeacherSuggestions.set(false);
    this.showRoomSuggestions.set(false);

    this.serverError.set('');
  }

  saveClass(): void {
    this.classForm.markAllAsTouched();
    this.serverError.set('');

    if (this.classForm.invalid || this.isSubmitting()) {
      return;
    }

    const selectedClass = this.selectedClass();
    const payload = this.buildClassPayload();

    this.isSubmitting.set(true);

    if (selectedClass) {
      this.classesService.updateClass(selectedClass.id, payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeClassModal();
          this.loadClasses();
          this.showToast('Class updated successfully.', 'success');
        },
        error: (error) => {
          this.isSubmitting.set(false);
          this.serverError.set(
            error?.error?.message || 'Failed to update class.',
          );
          this.showToast('Failed to update class.', 'error');
        },
      });

      return;
    }

    this.classesService.createClass(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeClassModal();
        this.loadClasses();
        this.showToast('Class added successfully.', 'success');
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.serverError.set(
          error?.error?.message || 'Failed to create class.',
        );
        this.showToast('Failed to create class.', 'error');
      },
    });
  }

  openDeleteModal(schoolClass: SchoolClass): void {
    this.classToDelete.set(schoolClass);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.classToDelete.set(null);
  }

  confirmDeleteClass(): void {
    const schoolClass = this.classToDelete();

    if (!schoolClass || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);

    this.classesService.deleteClass(schoolClass.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.classToDelete.set(null);
        this.loadClasses();
        this.showToast('Class deleted successfully.', 'success');
      },
      error: (error) => {
        this.isDeleting.set(false);
        this.classToDelete.set(null);
        this.serverError.set(
          error?.error?.message || 'Failed to delete class.',
        );
        this.showToast('Failed to delete class.', 'error');
      },
    });
  }

  getClassLabel(schoolClass: SchoolClass): string {
    return `${schoolClass.className} ${schoolClass.section}`.trim();
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

  isInvalid(controlName: keyof typeof this.classForm.controls): boolean {
    const control = this.classForm.controls[controlName];
    return control.invalid && control.touched;
  }

  private buildClassPayload(): CreateClassPayload {
    const formValue = this.classForm.getRawValue();

    const payload: CreateClassPayload = {
      className: formValue.className.trim(),
      section: formValue.section.trim(),
      status: formValue.status,
    };

    if (formValue.classTeacher.trim()) {
      payload.classTeacher = formValue.classTeacher.trim();
    }

    if (formValue.roomNo.trim()) {
      payload.roomNo = formValue.roomNo.trim();
    }

    if (formValue.capacity !== null && formValue.capacity !== undefined) {
      payload.capacity = Number(formValue.capacity);
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
