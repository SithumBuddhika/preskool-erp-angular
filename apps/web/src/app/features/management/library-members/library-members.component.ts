import { Component, OnInit, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  CreateLibraryMemberPayload,
  LibraryMember,
  LibraryMemberStatus,
  LibraryMemberType,
} from '../../../core/models/library-member.model';
import { Staff } from '../../../core/models/staff.model';
import { Student } from '../../../core/models/student.model';
import { Teacher } from '../../../core/models/teacher.model';
import { LibraryMembersService } from '../../../core/services/library-members.service';
import { StaffsService } from '../../../core/services/staffs.service';
import { StudentsService } from '../../../core/services/students.service';
import { TeachersService } from '../../../core/services/teachers.service';

type ToastType = 'success' | 'error';

type MemberSuggestion = {
  id: string;
  type: LibraryMemberType;
  referenceCode: string;
  memberName: string;
  className?: string;
  department?: string;
  phone?: string;
  email?: string;
  description: string;
};

@Component({
  selector: 'app-library-members',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './library-members.component.html',
  styleUrl: './library-members.component.scss',
})
export class LibraryMembersComponent implements OnInit {
  members = signal<LibraryMember[]>([]);
  students = signal<Student[]>([]);
  teachers = signal<Teacher[]>([]);
  staffs = signal<Staff[]>([]);

  selectedMember = signal<LibraryMember | null>(null);
  memberToDelete = signal<LibraryMember | null>(null);

  isLoading = signal(false);
  isSubmitting = signal(false);
  isDeleting = signal(false);
  showMemberModal = signal(false);

  showMemberSuggestions = signal(false);
  memberSearchTerm = signal('');

  serverError = signal('');
  searchTerm = signal('');

  toast = signal<{ message: string; type: ToastType } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  isEditMode = computed(() => this.selectedMember() !== null);

  activeMembers = computed(
    () => this.members().filter((member) => member.status === 'ACTIVE').length,
  );

  inactiveMembers = computed(
    () =>
      this.members().filter((member) => member.status === 'INACTIVE').length,
  );

  blockedMembers = computed(
    () => this.members().filter((member) => member.status === 'BLOCKED').length,
  );

  studentMembers = computed(
    () =>
      this.members().filter((member) => member.memberType === 'STUDENT').length,
  );

  teacherMembers = computed(
    () =>
      this.members().filter((member) => member.memberType === 'TEACHER').length,
  );

  staffMembers = computed(
    () =>
      this.members().filter((member) => member.memberType === 'STAFF').length,
  );

  memberSuggestions = computed(() => {
    const memberType = this.memberForm.controls.memberType.value;
    const keyword = this.memberSearchTerm().trim().toLowerCase();

    let suggestions: MemberSuggestion[] = [];

    if (memberType === 'STUDENT') {
      suggestions = this.students()
        .filter((student) => student.status !== 'INACTIVE')
        .map((student) => ({
          id: student.id,
          type: 'STUDENT',
          referenceCode: student.admissionNo,
          memberName: `${student.firstName} ${student.lastName}`.trim(),
          className: `${student.className} ${student.section || ''}`.trim(),
          phone: student.phone || student.guardianPhone || '',
          email: student.email || '',
          description: `${student.admissionNo} · ${student.className}${
            student.section ? ` ${student.section}` : ''
          }`,
        }));
    }

    if (memberType === 'TEACHER') {
      suggestions = this.teachers()
        .filter((teacher) => teacher.status !== 'INACTIVE')
        .map((teacher) => ({
          id: teacher.id,
          type: 'TEACHER',
          referenceCode: teacher.employeeNo,
          memberName: teacher.fullName,
          department: teacher.subject,
          phone: teacher.phone,
          email: teacher.email,
          description: `${teacher.employeeNo} · ${teacher.subject || 'Teacher'}`,
        }));
    }

    if (memberType === 'STAFF') {
      suggestions = this.staffs()
        .filter((staff) => staff.status !== 'INACTIVE')
        .map((staff) => ({
          id: staff.id,
          type: 'STAFF',
          referenceCode: staff.staffCode,
          memberName: staff.fullName,
          department: staff.departmentName,
          phone: staff.phone,
          email: staff.email,
          description: `${staff.staffCode} · ${staff.departmentName || 'Staff'}`,
        }));
    }

    if (!keyword) {
      return suggestions.slice(0, 6);
    }

    return suggestions
      .filter((suggestion) =>
        [
          suggestion.referenceCode,
          suggestion.memberName,
          suggestion.className,
          suggestion.department,
          suggestion.phone,
          suggestion.email,
          suggestion.description,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(keyword),
      )
      .slice(0, 6);
  });

  memberForm = new FormGroup({
    memberCode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    memberType: new FormControl<LibraryMemberType>('STUDENT', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    referenceCode: new FormControl('', {
      nonNullable: true,
    }),
    memberName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    className: new FormControl('', {
      nonNullable: true,
    }),
    department: new FormControl('', {
      nonNullable: true,
    }),
    phone: new FormControl('', {
      nonNullable: true,
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.email],
    }),
    joinDate: new FormControl(this.getTodayDate(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    status: new FormControl<LibraryMemberStatus>('ACTIVE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    notes: new FormControl('', {
      nonNullable: true,
    }),
  });

  constructor(
    private readonly libraryMembersService: LibraryMembersService,
    private readonly studentsService: StudentsService,
    private readonly teachersService: TeachersService,
    private readonly staffsService: StaffsService,
  ) {}

  ngOnInit(): void {
    this.loadMembers();
    this.loadReferenceData();
  }

  loadMembers(search = this.searchTerm()): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.libraryMembersService.getLibraryMembers(search).subscribe({
      next: (members) => {
        this.members.set(members);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.serverError.set(
          error?.error?.message || 'Failed to load library members.',
        );
        this.isLoading.set(false);
        this.showToast('Failed to load library members.', 'error');
      },
    });
  }

  loadReferenceData(): void {
    this.studentsService.getStudents().subscribe({
      next: (students) => {
        this.students.set(students);
      },
      error: () => {
        this.showToast('Student suggestions could not load.', 'error');
      },
    });

    this.teachersService.getTeachers().subscribe({
      next: (teachers) => {
        this.teachers.set(teachers);
      },
      error: () => {
        this.showToast('Teacher suggestions could not load.', 'error');
      },
    });

    this.staffsService.getStaffs().subscribe({
      next: (staffs) => {
        this.staffs.set(staffs);
      },
      error: () => {
        this.showToast('Staff suggestions could not load.', 'error');
      },
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.searchTerm.set(value);
    this.loadMembers(value);
  }

  onMemberTypeChange(): void {
    this.memberSearchTerm.set('');
    this.showMemberSuggestions.set(false);

    this.memberForm.patchValue({
      referenceCode: '',
      memberName: '',
      className: '',
      department: '',
      phone: '',
      email: '',
    });
  }

  onMemberSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.memberSearchTerm.set(value);
    this.showMemberSuggestions.set(true);
  }

  onMemberSearchFocus(): void {
    this.memberSearchTerm.set(this.memberForm.controls.memberName.value);
    this.showMemberSuggestions.set(true);
  }

  onMemberSearchBlur(): void {
    setTimeout(() => {
      this.showMemberSuggestions.set(false);
    }, 160);
  }

  selectMemberSuggestion(suggestion: MemberSuggestion): void {
    this.memberForm.patchValue({
      referenceCode: suggestion.referenceCode,
      memberName: suggestion.memberName,
      className: suggestion.className || '',
      department: suggestion.department || '',
      phone: suggestion.phone || '',
      email: suggestion.email || '',
    });

    this.memberSearchTerm.set(suggestion.memberName);
    this.showMemberSuggestions.set(false);
  }

  openCreateModal(): void {
    this.selectedMember.set(null);

    this.memberForm.reset({
      memberCode: '',
      memberType: 'STUDENT',
      referenceCode: '',
      memberName: '',
      className: '',
      department: '',
      phone: '',
      email: '',
      joinDate: this.getTodayDate(),
      status: 'ACTIVE',
      notes: '',
    });

    this.memberSearchTerm.set('');
    this.showMemberSuggestions.set(false);
    this.serverError.set('');
    this.showMemberModal.set(true);

    this.libraryMembersService.generateNextMemberCode().subscribe({
      next: (memberCode) => {
        if (!this.isEditMode() && this.showMemberModal()) {
          this.memberForm.controls.memberCode.setValue(memberCode);
        }
      },
      error: () => {
        this.showToast(
          'Could not generate member code. Please enter it manually.',
          'error',
        );
      },
    });
  }

  openEditModal(member: LibraryMember): void {
    this.selectedMember.set(member);

    this.memberForm.reset({
      memberCode: member.memberCode,
      memberType: member.memberType,
      referenceCode: member.referenceCode || '',
      memberName: member.memberName,
      className: member.className || '',
      department: member.department || '',
      phone: member.phone || '',
      email: member.email || '',
      joinDate: this.formatDateForInput(member.joinDate),
      status: member.status,
      notes: member.notes || '',
    });

    this.memberSearchTerm.set(member.memberName);
    this.showMemberSuggestions.set(false);
    this.serverError.set('');
    this.showMemberModal.set(true);
  }

  closeMemberModal(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.showMemberModal.set(false);
    this.selectedMember.set(null);
    this.memberSearchTerm.set('');
    this.showMemberSuggestions.set(false);
    this.serverError.set('');
  }

  saveMember(): void {
    this.memberForm.markAllAsTouched();
    this.serverError.set('');

    if (this.memberForm.invalid || this.isSubmitting()) {
      return;
    }

    const selectedMember = this.selectedMember();
    const payload = this.buildMemberPayload();

    this.isSubmitting.set(true);

    if (selectedMember) {
      this.libraryMembersService
        .updateLibraryMember(selectedMember.id, payload)
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.closeMemberModal();
            this.loadMembers();
            this.showToast('Library member updated successfully.', 'success');
          },
          error: (error) => {
            this.isSubmitting.set(false);
            this.serverError.set(
              error?.error?.message || 'Failed to update library member.',
            );
            this.showToast('Failed to update library member.', 'error');
          },
        });

      return;
    }

    this.libraryMembersService.createLibraryMember(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeMemberModal();
        this.loadMembers();
        this.showToast('Library member added successfully.', 'success');
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.serverError.set(
          error?.error?.message || 'Failed to create library member.',
        );
        this.showToast('Failed to create library member.', 'error');
      },
    });
  }

  openDeleteModal(member: LibraryMember): void {
    this.memberToDelete.set(member);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.memberToDelete.set(null);
  }

  confirmDeleteMember(): void {
    const member = this.memberToDelete();

    if (!member || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);

    this.libraryMembersService.deleteLibraryMember(member.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.memberToDelete.set(null);
        this.loadMembers();
        this.showToast('Library member deleted successfully.', 'success');
      },
      error: (error) => {
        this.isDeleting.set(false);
        this.memberToDelete.set(null);
        this.serverError.set(
          error?.error?.message || 'Failed to delete library member.',
        );
        this.showToast('Failed to delete library member.', 'error');
      },
    });
  }

  getMemberInitial(member: LibraryMember): string {
    return member.memberName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((name) => name.charAt(0))
      .join('')
      .toUpperCase();
  }

  getSuggestionInitial(suggestion: MemberSuggestion): string {
    return suggestion.memberName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((name) => name.charAt(0))
      .join('')
      .toUpperCase();
  }

  getMemberTypeLabel(memberType: LibraryMemberType): string {
    return memberType.charAt(0) + memberType.slice(1).toLowerCase();
  }

  getStatusLabel(status: LibraryMemberStatus): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  getReferenceLabel(): string {
    const memberType = this.memberForm.controls.memberType.value;

    if (memberType === 'STUDENT') {
      return 'Student / Admission No';
    }

    if (memberType === 'TEACHER') {
      return 'Teacher / Employee No';
    }

    return 'Staff / Staff Code';
  }

  getReferencePlaceholder(): string {
    const memberType = this.memberForm.controls.memberType.value;

    if (memberType === 'STUDENT') {
      return 'Search student by name or admission no';
    }

    if (memberType === 'TEACHER') {
      return 'Search teacher by name or employee no';
    }

    return 'Search staff by name or staff code';
  }

  formatDisplayDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  }

  isInvalid(controlName: keyof typeof this.memberForm.controls): boolean {
    const control = this.memberForm.controls[controlName];

    return control.invalid && control.touched;
  }

  private buildMemberPayload(): CreateLibraryMemberPayload {
    const formValue = this.memberForm.getRawValue();

    const payload: CreateLibraryMemberPayload = {
      memberCode: formValue.memberCode.trim(),
      memberType: formValue.memberType,
      memberName: formValue.memberName.trim(),
      joinDate: formValue.joinDate,
      status: formValue.status,
    };

    if (formValue.referenceCode.trim()) {
      payload.referenceCode = formValue.referenceCode.trim();
    }

    if (formValue.className.trim()) {
      payload.className = formValue.className.trim();
    }

    if (formValue.department.trim()) {
      payload.department = formValue.department.trim();
    }

    if (formValue.phone.trim()) {
      payload.phone = formValue.phone.trim();
    }

    if (formValue.email.trim()) {
      payload.email = formValue.email.trim();
    }

    if (formValue.notes.trim()) {
      payload.notes = formValue.notes.trim();
    }

    return payload;
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private formatDateForInput(date: string): string {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return this.getTodayDate();
    }

    return parsedDate.toISOString().split('T')[0];
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
