import { Component, OnInit, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { SchoolClass } from '../../../core/models/school-class.model';
import { Subject } from '../../../core/models/subject.model';
import {
  CreateSyllabusSubjectGroupPayload,
  SyllabusSubjectGroup,
  SyllabusSubjectGroupStatus,
} from '../../../core/models/syllabus-subject-group.model';
import { Teacher } from '../../../core/models/teacher.model';
import { ClassesService } from '../../../core/services/classes.service';
import { SubjectsService } from '../../../core/services/subjects.service';
import { SyllabusSubjectGroupsService } from '../../../core/services/syllabus-subject-groups.service';
import { TeachersService } from '../../../core/services/teachers.service';

type ToastType = 'success' | 'error';

type SelectedSubject = {
  id?: string;
  subjectCode?: string;
  subjectName: string;
  className?: string;
  teacherName?: string;
};

@Component({
  selector: 'app-syllabus-subject-groups',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './syllabus-subject-groups.component.html',
  styleUrl: './syllabus-subject-groups.component.scss',
})
export class SyllabusSubjectGroupsComponent implements OnInit {
  groups = signal<SyllabusSubjectGroup[]>([]);
  classes = signal<SchoolClass[]>([]);
  subjects = signal<Subject[]>([]);
  teachers = signal<Teacher[]>([]);

  selectedGroup = signal<SyllabusSubjectGroup | null>(null);
  groupToDelete = signal<SyllabusSubjectGroup | null>(null);
  selectedSubjects = signal<SelectedSubject[]>([]);

  isLoading = signal(false);
  isSubmitting = signal(false);
  isDeleting = signal(false);
  showGroupModal = signal(false);

  serverError = signal('');
  searchTerm = signal('');

  showClassSuggestions = signal(false);
  classSearchTerm = signal('');

  showTeacherSuggestions = signal(false);
  teacherSearchTerm = signal('');

  showSubjectSuggestions = signal(false);
  subjectSearchTerm = signal('');

  toast = signal<{ message: string; type: ToastType } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  isEditMode = computed(() => this.selectedGroup() !== null);

  activeGroups = computed(
    () => this.groups().filter((group) => group.status === 'ACTIVE').length,
  );

  inactiveGroups = computed(
    () => this.groups().filter((group) => group.status === 'INACTIVE').length,
  );

  totalGroupedSubjects = computed(() =>
    this.groups().reduce((total, group) => total + group.totalSubjects, 0),
  );

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
          teacher.subject,
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
    const selectedClassName = this.groupForm.controls.className.value;

    const selectedSubjectKeys = new Set(
      this.selectedSubjects().map((subject) =>
        this.getSubjectKey(subject.subjectCode, subject.subjectName),
      ),
    );

    return this.subjects()
      .filter((subject) => subject.status !== 'INACTIVE')
      .filter((subject) => {
        const subjectKey = this.getSubjectKey(
          subject.subjectCode,
          subject.subjectName,
        );

        return !selectedSubjectKeys.has(subjectKey);
      })
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
          subject.subjectCode,
          subject.subjectName,
          subject.className,
          subject.teacherName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(keyword);
      })
      .slice(0, 8);
  });

  groupForm = new FormGroup({
    groupCode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    groupName: new FormControl('', {
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
    classTeacher: new FormControl('', {
      nonNullable: true,
    }),
    status: new FormControl<SyllabusSubjectGroupStatus>('ACTIVE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor(
    private readonly syllabusSubjectGroupsService: SyllabusSubjectGroupsService,
    private readonly classesService: ClassesService,
    private readonly subjectsService: SubjectsService,
    private readonly teachersService: TeachersService,
  ) {}

  ngOnInit(): void {
    this.loadGroups();
    this.loadClasses();
    this.loadSubjects();
    this.loadTeachers();
  }

  loadGroups(search = this.searchTerm()): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.syllabusSubjectGroupsService
      .getSyllabusSubjectGroups(search)
      .subscribe({
        next: (groups) => {
          this.groups.set(groups);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.serverError.set(
            error?.error?.message || 'Failed to load syllabus subject groups.',
          );
          this.isLoading.set(false);
          this.showToast('Failed to load syllabus subject groups.', 'error');
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

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.loadGroups(value);
  }

  onClassInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.classSearchTerm.set(value);
    this.showClassSuggestions.set(true);

    if (!value.trim()) {
      this.groupForm.controls.section.setValue('');
    }
  }

  onClassFocus(): void {
    const value = this.groupForm.controls.className.value;
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

    this.groupForm.controls.className.setValue(classLabel);
    this.groupForm.controls.section.setValue(schoolClass.section);
    this.classSearchTerm.set(classLabel);
    this.showClassSuggestions.set(false);

    if (
      schoolClass.classTeacher &&
      !this.groupForm.controls.classTeacher.value
    ) {
      this.groupForm.controls.classTeacher.setValue(schoolClass.classTeacher);
      this.teacherSearchTerm.set(schoolClass.classTeacher);
    }
  }

  onTeacherInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.teacherSearchTerm.set(value);
    this.showTeacherSuggestions.set(true);
  }

  onTeacherFocus(): void {
    const value = this.groupForm.controls.classTeacher.value;
    this.teacherSearchTerm.set(value);
    this.showTeacherSuggestions.set(true);
  }

  onTeacherBlur(): void {
    setTimeout(() => {
      this.showTeacherSuggestions.set(false);
    }, 160);
  }

  selectTeacher(teacher: Teacher): void {
    this.groupForm.controls.classTeacher.setValue(teacher.fullName);
    this.teacherSearchTerm.set(teacher.fullName);
    this.showTeacherSuggestions.set(false);
  }

  onSubjectInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.subjectSearchTerm.set(value);
    this.showSubjectSuggestions.set(true);
  }

  onSubjectFocus(): void {
    this.showSubjectSuggestions.set(true);
  }

  onSubjectBlur(): void {
    setTimeout(() => {
      this.showSubjectSuggestions.set(false);
    }, 160);
  }

  selectSubject(subject: Subject): void {
    const selectedSubject: SelectedSubject = {
      id: subject.id,
      subjectCode: subject.subjectCode,
      subjectName: subject.subjectName,
      className: subject.className || undefined,
      teacherName: subject.teacherName || undefined,
    };

    this.selectedSubjects.set([...this.selectedSubjects(), selectedSubject]);
    this.subjectSearchTerm.set('');
    this.showSubjectSuggestions.set(false);
  }

  removeSelectedSubject(subjectToRemove: SelectedSubject): void {
    const removeKey = this.getSubjectKey(
      subjectToRemove.subjectCode,
      subjectToRemove.subjectName,
    );

    this.selectedSubjects.set(
      this.selectedSubjects().filter((subject) => {
        const subjectKey = this.getSubjectKey(
          subject.subjectCode,
          subject.subjectName,
        );

        return subjectKey !== removeKey;
      }),
    );
  }

  openCreateModal(): void {
    this.selectedGroup.set(null);
    this.selectedSubjects.set([]);

    this.groupForm.reset({
      groupCode: '',
      groupName: '',
      className: '',
      section: '',
      classTeacher: '',
      status: 'ACTIVE',
    });

    this.syllabusSubjectGroupsService.generateNextGroupCode().subscribe({
      next: (groupCode) => {
        this.groupForm.controls.groupCode.setValue(groupCode);
      },
      error: () => {
        this.groupForm.controls.groupCode.setValue('SSG-0001');
        this.showToast('Could not generate next group ID.', 'error');
      },
    });

    this.resetSuggestionState();
    this.serverError.set('');
    this.showGroupModal.set(true);
  }

  openEditModal(group: SyllabusSubjectGroup): void {
    this.selectedGroup.set(group);

    this.groupForm.reset({
      groupCode: group.groupCode,
      groupName: group.groupName,
      className: group.className,
      section: group.section,
      classTeacher: group.classTeacher || '',
      status: group.status,
    });

    const selectedSubjects = group.subjectNames.map((subjectName, index) => ({
      subjectName,
      subjectCode: group.subjectCodes?.[index] || '',
      className: group.className,
      teacherName: group.classTeacher || undefined,
    }));

    this.selectedSubjects.set(selectedSubjects);

    this.classSearchTerm.set(group.className);
    this.teacherSearchTerm.set(group.classTeacher || '');
    this.subjectSearchTerm.set('');

    this.showClassSuggestions.set(false);
    this.showTeacherSuggestions.set(false);
    this.showSubjectSuggestions.set(false);

    this.serverError.set('');
    this.showGroupModal.set(true);
  }

  closeGroupModal(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.showGroupModal.set(false);
    this.selectedGroup.set(null);
    this.selectedSubjects.set([]);
    this.resetSuggestionState();
    this.serverError.set('');
  }

  saveGroup(): void {
    this.groupForm.markAllAsTouched();
    this.serverError.set('');

    if (this.groupForm.invalid || this.isSubmitting()) {
      return;
    }

    if (this.selectedSubjects().length === 0) {
      this.serverError.set('Please select at least one subject.');
      return;
    }

    const selectedGroup = this.selectedGroup();
    const payload = this.buildGroupPayload();

    this.isSubmitting.set(true);

    if (selectedGroup) {
      this.syllabusSubjectGroupsService
        .updateSyllabusSubjectGroup(selectedGroup.id, payload)
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.closeGroupModal();
            this.loadGroups();
            this.showToast(
              'Syllabus subject group updated successfully.',
              'success',
            );
          },
          error: (error) => {
            this.isSubmitting.set(false);
            this.serverError.set(
              error?.error?.message ||
                'Failed to update syllabus subject group.',
            );
            this.showToast('Failed to update syllabus subject group.', 'error');
          },
        });

      return;
    }

    this.syllabusSubjectGroupsService
      .createSyllabusSubjectGroup(payload)
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeGroupModal();
          this.loadGroups();
          this.showToast(
            'Syllabus subject group added successfully.',
            'success',
          );
        },
        error: (error) => {
          this.isSubmitting.set(false);
          this.serverError.set(
            error?.error?.message || 'Failed to create syllabus subject group.',
          );
          this.showToast('Failed to create syllabus subject group.', 'error');
        },
      });
  }

  openDeleteModal(group: SyllabusSubjectGroup): void {
    this.groupToDelete.set(group);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.groupToDelete.set(null);
  }

  confirmDeleteGroup(): void {
    const group = this.groupToDelete();

    if (!group || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);

    this.syllabusSubjectGroupsService
      .deleteSyllabusSubjectGroup(group.id)
      .subscribe({
        next: () => {
          this.isDeleting.set(false);
          this.groupToDelete.set(null);
          this.loadGroups();
          this.showToast(
            'Syllabus subject group deleted successfully.',
            'success',
          );
        },
        error: (error) => {
          this.isDeleting.set(false);
          this.groupToDelete.set(null);
          this.serverError.set(
            error?.error?.message || 'Failed to delete syllabus subject group.',
          );
          this.showToast('Failed to delete syllabus subject group.', 'error');
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

  getTeacherInitial(teacher: Teacher): string {
    return teacher.fullName
      .split(' ')
      .map((name) => name.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  getSubjectInitial(subject: SelectedSubject | Subject): string {
    return subject.subjectName.charAt(0).toUpperCase();
  }

  getGroupInitial(group: SyllabusSubjectGroup): string {
    return group.groupName
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  getStatusLabel(status: SyllabusSubjectGroupStatus): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  getVisibleSubjects(group: SyllabusSubjectGroup): string[] {
    return group.subjectNames.slice(0, 3);
  }

  getRemainingSubjectCount(group: SyllabusSubjectGroup): number {
    return Math.max(group.subjectNames.length - 3, 0);
  }

  isInvalid(controlName: keyof typeof this.groupForm.controls): boolean {
    const control = this.groupForm.controls[controlName];
    return control.invalid && control.touched;
  }

  private buildGroupPayload(): CreateSyllabusSubjectGroupPayload {
    const formValue = this.groupForm.getRawValue();
    const selectedSubjects = this.selectedSubjects();

    return {
      groupCode: formValue.groupCode.trim(),
      groupName: formValue.groupName.trim(),
      className: formValue.className.trim(),
      section: formValue.section.trim(),
      classTeacher: formValue.classTeacher.trim(),
      subjectNames: selectedSubjects.map((subject) =>
        subject.subjectName.trim(),
      ),
      subjectCodes: selectedSubjects
        .map((subject) => subject.subjectCode?.trim() || '')
        .filter(Boolean),
      status: formValue.status,
    };
  }

  private getSubjectKey(subjectCode?: string, subjectName?: string): string {
    return (subjectCode || subjectName || '').trim().toLowerCase();
  }

  private resetSuggestionState(): void {
    this.classSearchTerm.set('');
    this.teacherSearchTerm.set('');
    this.subjectSearchTerm.set('');

    this.showClassSuggestions.set(false);
    this.showTeacherSuggestions.set(false);
    this.showSubjectSuggestions.set(false);
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
