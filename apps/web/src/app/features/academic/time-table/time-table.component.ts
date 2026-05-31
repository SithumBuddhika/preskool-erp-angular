import { Component, OnInit, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ClassRoom } from '../../../core/models/class-room.model';
import { SchoolClass } from '../../../core/models/school-class.model';
import { Subject } from '../../../core/models/subject.model';
import { Teacher } from '../../../core/models/teacher.model';
import {
  CreateTimeTablePayload,
  TimeTable,
  TimeTableDay,
  TimeTableStatus,
} from '../../../core/models/time-table.model';
import { ClassRoomsService } from '../../../core/services/class-rooms.service';
import { ClassesService } from '../../../core/services/classes.service';
import { SubjectsService } from '../../../core/services/subjects.service';
import { TeachersService } from '../../../core/services/teachers.service';
import { TimeTableService } from '../../../core/services/time-table.service';

type ToastType = 'success' | 'error';

@Component({
  selector: 'app-time-table',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './time-table.component.html',
  styleUrl: './time-table.component.scss',
})
export class TimeTableComponent implements OnInit {
  timeTables = signal<TimeTable[]>([]);
  classes = signal<SchoolClass[]>([]);
  subjects = signal<Subject[]>([]);
  teachers = signal<Teacher[]>([]);
  rooms = signal<ClassRoom[]>([]);

  selectedTimeTable = signal<TimeTable | null>(null);
  timeTableToDelete = signal<TimeTable | null>(null);

  isLoading = signal(false);
  isSubmitting = signal(false);
  isDeleting = signal(false);
  showTimeTableModal = signal(false);

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

  days: { label: string; shortLabel: string; value: TimeTableDay }[] = [
    { label: 'Monday', shortLabel: 'MON', value: 'MONDAY' },
    { label: 'Tuesday', shortLabel: 'TUE', value: 'TUESDAY' },
    { label: 'Wednesday', shortLabel: 'WED', value: 'WEDNESDAY' },
    { label: 'Thursday', shortLabel: 'THU', value: 'THURSDAY' },
    { label: 'Friday', shortLabel: 'FRI', value: 'FRIDAY' },
    { label: 'Saturday', shortLabel: 'SAT', value: 'SATURDAY' },
    { label: 'Sunday', shortLabel: 'SUN', value: 'SUNDAY' },
  ];

  isEditMode = computed(() => this.selectedTimeTable() !== null);

  activeRecords = computed(
    () =>
      this.timeTables().filter((timeTable) => timeTable.status === 'ACTIVE')
        .length,
  );

  inactiveRecords = computed(
    () =>
      this.timeTables().filter((timeTable) => timeTable.status === 'INACTIVE')
        .length,
  );

  totalRoomsUsed = computed(() => {
    const rooms = this.timeTables()
      .map((timeTable) => timeTable.roomNo)
      .filter(Boolean);

    return new Set(rooms).size;
  });

  totalClassesUsed = computed(() => {
    const classes = this.timeTables()
      .map((timeTable) => timeTable.className)
      .filter(Boolean);

    return new Set(classes).size;
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
    const selectedClassName = this.timeTableForm.controls.className.value;

    const activeSubjects = this.subjects().filter(
      (subject) => subject.status !== 'INACTIVE',
    );

    return activeSubjects
      .filter((subject) => {
        if (!selectedClassName) {
          return true;
        }

        return !subject.className || subject.className === selectedClassName;
      })
      .filter((subject) => {
        if (!keyword) {
          return true;
        }

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

  timeTableForm = new FormGroup({
    timeTableCode: new FormControl('', {
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
    day: new FormControl<TimeTableDay>('MONDAY', {
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
    status: new FormControl<TimeTableStatus>('ACTIVE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor(
    private readonly timeTableService: TimeTableService,
    private readonly classesService: ClassesService,
    private readonly subjectsService: SubjectsService,
    private readonly teachersService: TeachersService,
    private readonly classRoomsService: ClassRoomsService,
  ) {}

  ngOnInit(): void {
    this.loadTimeTables();
    this.loadClasses();
    this.loadSubjects();
    this.loadTeachers();
    this.loadRooms();
  }

  loadTimeTables(search = this.searchTerm()): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.timeTableService.getTimeTable(search).subscribe({
      next: (timeTables) => {
        this.timeTables.set(timeTables);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.serverError.set(
          error?.error?.message || 'Failed to load time table records.',
        );
        this.isLoading.set(false);
        this.showToast('Failed to load time table records.', 'error');
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
    this.loadTimeTables(value);
  }

  onClassInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.classSearchTerm.set(value);
    this.showClassSuggestions.set(true);

    if (!value.trim()) {
      this.timeTableForm.controls.section.setValue('');
    }
  }

  onClassFocus(): void {
    const value = this.timeTableForm.controls.className.value;
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

    this.timeTableForm.controls.className.setValue(classLabel);
    this.timeTableForm.controls.section.setValue(schoolClass.section);
    this.classSearchTerm.set(classLabel);
    this.showClassSuggestions.set(false);

    if (
      schoolClass.classTeacher &&
      !this.timeTableForm.controls.teacherName.value
    ) {
      this.timeTableForm.controls.teacherName.setValue(
        schoolClass.classTeacher,
      );
      this.teacherSearchTerm.set(schoolClass.classTeacher);
    }

    if (schoolClass.roomNo && !this.timeTableForm.controls.roomNo.value) {
      this.timeTableForm.controls.roomNo.setValue(schoolClass.roomNo);
      this.roomSearchTerm.set(schoolClass.roomNo);
    }
  }

  onSubjectInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.subjectSearchTerm.set(value);
    this.showSubjectSuggestions.set(true);
  }

  onSubjectFocus(): void {
    const value = this.timeTableForm.controls.subjectName.value;
    this.subjectSearchTerm.set(value);
    this.showSubjectSuggestions.set(true);
  }

  onSubjectBlur(): void {
    setTimeout(() => {
      this.showSubjectSuggestions.set(false);
    }, 160);
  }

  selectSubject(subject: Subject): void {
    this.timeTableForm.controls.subjectName.setValue(subject.subjectName);
    this.subjectSearchTerm.set(subject.subjectName);
    this.showSubjectSuggestions.set(false);

    if (subject.teacherName && !this.timeTableForm.controls.teacherName.value) {
      this.timeTableForm.controls.teacherName.setValue(subject.teacherName);
      this.teacherSearchTerm.set(subject.teacherName);
    }
  }

  onTeacherInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.teacherSearchTerm.set(value);
    this.showTeacherSuggestions.set(true);
  }

  onTeacherFocus(): void {
    const value = this.timeTableForm.controls.teacherName.value;
    this.teacherSearchTerm.set(value);
    this.showTeacherSuggestions.set(true);
  }

  onTeacherBlur(): void {
    setTimeout(() => {
      this.showTeacherSuggestions.set(false);
    }, 160);
  }

  selectTeacher(teacher: Teacher): void {
    this.timeTableForm.controls.teacherName.setValue(teacher.fullName);
    this.teacherSearchTerm.set(teacher.fullName);
    this.showTeacherSuggestions.set(false);
  }

  onRoomInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.roomSearchTerm.set(value);
    this.showRoomSuggestions.set(true);
  }

  onRoomFocus(): void {
    const value = this.timeTableForm.controls.roomNo.value;
    this.roomSearchTerm.set(value);
    this.showRoomSuggestions.set(true);
  }

  onRoomBlur(): void {
    setTimeout(() => {
      this.showRoomSuggestions.set(false);
    }, 160);
  }

  selectRoom(room: ClassRoom): void {
    this.timeTableForm.controls.roomNo.setValue(room.roomNo);
    this.roomSearchTerm.set(room.roomNo);
    this.showRoomSuggestions.set(false);
  }

  openCreateModal(): void {
    this.selectedTimeTable.set(null);

    this.timeTableForm.reset({
      timeTableCode: '',
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

    this.timeTableService.generateNextTimeTableCode().subscribe({
      next: (timeTableCode) => {
        this.timeTableForm.controls.timeTableCode.setValue(timeTableCode);
      },
      error: () => {
        this.timeTableForm.controls.timeTableCode.setValue('TTB-0001');
        this.showToast('Could not generate next time table ID.', 'error');
      },
    });

    this.resetSuggestionState();
    this.serverError.set('');
    this.showTimeTableModal.set(true);
  }

  openEditModal(timeTable: TimeTable): void {
    this.selectedTimeTable.set(timeTable);

    this.timeTableForm.reset({
      timeTableCode: timeTable.timeTableCode,
      className: timeTable.className,
      section: timeTable.section,
      subjectName: timeTable.subjectName,
      teacherName: timeTable.teacherName,
      roomNo: timeTable.roomNo,
      day: timeTable.day,
      startTime: timeTable.startTime,
      endTime: timeTable.endTime,
      status: timeTable.status,
    });

    this.classSearchTerm.set(timeTable.className);
    this.subjectSearchTerm.set(timeTable.subjectName);
    this.teacherSearchTerm.set(timeTable.teacherName);
    this.roomSearchTerm.set(timeTable.roomNo);

    this.showClassSuggestions.set(false);
    this.showSubjectSuggestions.set(false);
    this.showTeacherSuggestions.set(false);
    this.showRoomSuggestions.set(false);

    this.serverError.set('');
    this.showTimeTableModal.set(true);
  }

  closeTimeTableModal(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.showTimeTableModal.set(false);
    this.selectedTimeTable.set(null);
    this.resetSuggestionState();
    this.serverError.set('');
  }

  saveTimeTable(): void {
    this.timeTableForm.markAllAsTouched();
    this.serverError.set('');

    if (this.timeTableForm.invalid || this.isSubmitting()) {
      return;
    }

    const formValue = this.timeTableForm.getRawValue();

    if (formValue.startTime >= formValue.endTime) {
      this.serverError.set('End time must be later than start time.');
      return;
    }

    const selectedTimeTable = this.selectedTimeTable();
    const payload = this.buildTimeTablePayload();

    this.isSubmitting.set(true);

    if (selectedTimeTable) {
      this.timeTableService
        .updateTimeTable(selectedTimeTable.id, payload)
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.closeTimeTableModal();
            this.loadTimeTables();
            this.showToast(
              'Time table record updated successfully.',
              'success',
            );
          },
          error: (error) => {
            this.isSubmitting.set(false);
            this.serverError.set(
              error?.error?.message || 'Failed to update time table record.',
            );
            this.showToast('Failed to update time table record.', 'error');
          },
        });

      return;
    }

    this.timeTableService.createTimeTable(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeTimeTableModal();
        this.loadTimeTables();
        this.showToast('Time table record added successfully.', 'success');
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.serverError.set(
          error?.error?.message || 'Failed to create time table record.',
        );
        this.showToast('Failed to create time table record.', 'error');
      },
    });
  }

  openDeleteModal(timeTable: TimeTable): void {
    this.timeTableToDelete.set(timeTable);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.timeTableToDelete.set(null);
  }

  confirmDeleteTimeTable(): void {
    const timeTable = this.timeTableToDelete();

    if (!timeTable || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);

    this.timeTableService.deleteTimeTable(timeTable.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.timeTableToDelete.set(null);
        this.loadTimeTables();
        this.showToast('Time table record deleted successfully.', 'success');
      },
      error: (error) => {
        this.isDeleting.set(false);
        this.timeTableToDelete.set(null);
        this.serverError.set(
          error?.error?.message || 'Failed to delete time table record.',
        );
        this.showToast('Failed to delete time table record.', 'error');
      },
    });
  }

  getClassLabel(schoolClass: SchoolClass): string {
    return `${schoolClass.className} ${schoolClass.section}`.trim();
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

  getTimeTableInitial(timeTable: TimeTable): string {
    return timeTable.className
      .split(' ')
      .map((item) => item.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  getDayLabel(day: TimeTableDay): string {
    return this.days.find((item) => item.value === day)?.label || day;
  }

  getTimeRange(timeTable: TimeTable): string {
    return `${timeTable.startTime} - ${timeTable.endTime}`;
  }

  getDuration(timeTable: TimeTable): string {
    return this.calculateDuration(timeTable.startTime, timeTable.endTime);
  }

  getStatusLabel(status: TimeTableStatus): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  getRecordsByDay(day: TimeTableDay): TimeTable[] {
    return this.timeTables()
      .filter((timeTable) => timeTable.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  isInvalid(controlName: keyof typeof this.timeTableForm.controls): boolean {
    const control = this.timeTableForm.controls[controlName];
    return control.invalid && control.touched;
  }

  private buildTimeTablePayload(): CreateTimeTablePayload {
    const formValue = this.timeTableForm.getRawValue();

    return {
      timeTableCode: formValue.timeTableCode.trim(),
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
