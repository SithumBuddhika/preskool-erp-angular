import { Component, OnInit, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  CreateFeePayload,
  Fee,
  FeePaymentMethod,
  FeePaymentStatus,
  FeeType,
} from '../../../core/models/fee.model';
import { Student } from '../../../core/models/student.model';
import { FeesService } from '../../../core/services/fees.service';
import { StudentsService } from '../../../core/services/students.service';

type ToastType = 'success' | 'error';

@Component({
  selector: 'app-fees',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './fees.component.html',
  styleUrl: './fees.component.scss',
})
export class FeesComponent implements OnInit {
  fees = signal<Fee[]>([]);
  students = signal<Student[]>([]);

  selectedFee = signal<Fee | null>(null);
  feeToDelete = signal<Fee | null>(null);

  isLoading = signal(false);
  isSubmitting = signal(false);
  isDeleting = signal(false);
  showFeeModal = signal(false);

  serverError = signal('');
  searchTerm = signal('');

  showStudentSuggestions = signal(false);
  studentSearchTerm = signal('');

  toast = signal<{ message: string; type: ToastType } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  isEditMode = computed(() => this.selectedFee() !== null);

  paidFees = computed(
    () => this.fees().filter((fee) => fee.paymentStatus === 'PAID').length,
  );

  pendingFees = computed(
    () =>
      this.fees().filter(
        (fee) =>
          fee.paymentStatus === 'PENDING' || fee.paymentStatus === 'PARTIAL',
      ).length,
  );

  totalCollected = computed(() =>
    this.fees().reduce((total, fee) => total + Number(fee.paidAmount || 0), 0),
  );

  totalBalance = computed(() =>
    this.fees().reduce((total, fee) => total + Number(fee.balance || 0), 0),
  );

  filteredStudents = computed(() => {
    const keyword = this.studentSearchTerm().trim().toLowerCase();

    const activeStudents = this.students().filter(
      (student) => student.status === 'ACTIVE',
    );

    if (!keyword) {
      return activeStudents.slice(0, 8);
    }

    return activeStudents
      .filter((student) => {
        const searchableText = [
          student.admissionNo,
          student.firstName,
          student.lastName,
          student.email,
          student.className,
          student.section,
          student.guardianName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(keyword);
      })
      .slice(0, 8);
  });

  feeForm = new FormGroup({
    receiptNo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    studentAdmissionNo: new FormControl('', {
      nonNullable: true,
    }),
    studentName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    className: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    section: new FormControl('', {
      nonNullable: true,
    }),
    feeType: new FormControl<FeeType>('TUITION', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    amount: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    paidAmount: new FormControl('', {
      nonNullable: true,
      validators: [Validators.min(0)],
    }),
    dueDate: new FormControl('', {
      nonNullable: true,
    }),
    paidDate: new FormControl('', {
      nonNullable: true,
    }),
    paymentMethod: new FormControl<FeePaymentMethod | ''>('', {
      nonNullable: true,
    }),
    notes: new FormControl('', {
      nonNullable: true,
    }),
  });

  constructor(
    private readonly feesService: FeesService,
    private readonly studentsService: StudentsService,
  ) {}

  ngOnInit(): void {
    this.loadFees();
    this.loadStudents();
  }

  loadFees(search = this.searchTerm()): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.feesService.getFees(search).subscribe({
      next: (fees) => {
        this.fees.set(fees);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.serverError.set(error?.error?.message || 'Failed to load fees.');
        this.isLoading.set(false);
        this.showToast('Failed to load fees.', 'error');
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
    this.loadFees(value);
  }

  onStudentInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.studentSearchTerm.set(value);
    this.showStudentSuggestions.set(true);

    if (!value.trim()) {
      this.feeForm.controls.studentAdmissionNo.setValue('');
      this.feeForm.controls.className.setValue('');
      this.feeForm.controls.section.setValue('');
    }
  }

  onStudentFocus(): void {
    const value = this.feeForm.controls.studentName.value;
    this.studentSearchTerm.set(value);
    this.showStudentSuggestions.set(true);
  }

  onStudentBlur(): void {
    setTimeout(() => {
      this.showStudentSuggestions.set(false);
    }, 160);
  }

  selectStudent(student: Student): void {
    const studentName = this.getStudentFullName(student);

    this.feeForm.controls.studentAdmissionNo.setValue(student.admissionNo);
    this.feeForm.controls.studentName.setValue(studentName);
    this.feeForm.controls.className.setValue(student.className);
    this.feeForm.controls.section.setValue(student.section || '');

    this.studentSearchTerm.set(`${student.admissionNo} - ${studentName}`);
    this.showStudentSuggestions.set(false);
  }

  openCreateModal(): void {
    this.selectedFee.set(null);

    this.feeForm.reset({
      receiptNo: '',
      studentAdmissionNo: '',
      studentName: '',
      className: '',
      section: '',
      feeType: 'TUITION',
      amount: '',
      paidAmount: '',
      dueDate: '',
      paidDate: '',
      paymentMethod: '',
      notes: '',
    });

    this.feesService.generateNextReceiptNo().subscribe({
      next: (receiptNo) => {
        this.feeForm.controls.receiptNo.setValue(receiptNo);
      },
      error: () => {
        this.feeForm.controls.receiptNo.setValue('FEE-0001');
        this.showToast('Could not generate next receipt ID.', 'error');
      },
    });

    this.resetSuggestionState();
    this.serverError.set('');
    this.showFeeModal.set(true);
  }

  openEditModal(fee: Fee): void {
    this.selectedFee.set(fee);

    this.feeForm.reset({
      receiptNo: fee.receiptNo,
      studentAdmissionNo: fee.studentAdmissionNo || '',
      studentName: fee.studentName,
      className: fee.className,
      section: fee.section || '',
      feeType: fee.feeType,
      amount: String(fee.amount),
      paidAmount: String(fee.paidAmount || 0),
      dueDate: this.formatDateForInput(fee.dueDate),
      paidDate: this.formatDateForInput(fee.paidDate),
      paymentMethod: fee.paymentMethod || '',
      notes: fee.notes || '',
    });

    this.studentSearchTerm.set(
      fee.studentAdmissionNo
        ? `${fee.studentAdmissionNo} - ${fee.studentName}`
        : fee.studentName,
    );

    this.showStudentSuggestions.set(false);
    this.serverError.set('');
    this.showFeeModal.set(true);
  }

  closeFeeModal(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.showFeeModal.set(false);
    this.selectedFee.set(null);
    this.resetSuggestionState();
    this.serverError.set('');
  }

  saveFee(): void {
    this.feeForm.markAllAsTouched();
    this.serverError.set('');

    if (this.feeForm.invalid || this.isSubmitting()) {
      return;
    }

    const selectedFee = this.selectedFee();
    const payload = this.buildFeePayload();

    this.isSubmitting.set(true);

    if (selectedFee) {
      this.feesService.updateFee(selectedFee.id, payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeFeeModal();
          this.loadFees();
          this.showToast('Fee record updated successfully.', 'success');
        },
        error: (error) => {
          this.isSubmitting.set(false);
          this.serverError.set(
            error?.error?.message || 'Failed to update fee record.',
          );
          this.showToast('Failed to update fee record.', 'error');
        },
      });

      return;
    }

    this.feesService.createFee(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeFeeModal();
        this.loadFees();
        this.showToast('Fee record added successfully.', 'success');
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.serverError.set(
          error?.error?.message || 'Failed to create fee record.',
        );
        this.showToast('Failed to create fee record.', 'error');
      },
    });
  }

  openDeleteModal(fee: Fee): void {
    this.feeToDelete.set(fee);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.feeToDelete.set(null);
  }

  confirmDeleteFee(): void {
    const fee = this.feeToDelete();

    if (!fee || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);

    this.feesService.deleteFee(fee.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.feeToDelete.set(null);
        this.loadFees();
        this.showToast('Fee record deleted successfully.', 'success');
      },
      error: (error) => {
        this.isDeleting.set(false);
        this.feeToDelete.set(null);
        this.serverError.set(
          error?.error?.message || 'Failed to delete fee record.',
        );
        this.showToast('Failed to delete fee record.', 'error');
      },
    });
  }

  getStudentFullName(student: Student): string {
    return `${student.firstName} ${student.lastName}`.trim();
  }

  getStudentInitial(student: Student): string {
    return `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`
      .toUpperCase()
      .trim();
  }

  getFeeTypeLabel(type: FeeType): string {
    return type
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  getPaymentMethodLabel(method?: FeePaymentMethod | null): string {
    if (!method) {
      return 'Not added';
    }

    return method
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  getPaymentStatusLabel(status: FeePaymentStatus): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  getClassLabel(fee: Fee): string {
    return `${fee.className} ${fee.section || ''}`.trim();
  }

  getCurrentBalance(): number {
    const amount = Number(this.feeForm.controls.amount.value || 0);
    const paidAmount = Number(this.feeForm.controls.paidAmount.value || 0);

    return Math.max(amount - paidAmount, 0);
  }

  getCurrentPaymentStatus(): FeePaymentStatus {
    const amount = Number(this.feeForm.controls.amount.value || 0);
    const paidAmount = Number(this.feeForm.controls.paidAmount.value || 0);

    if (paidAmount >= amount && amount > 0) {
      return 'PAID';
    }

    if (paidAmount > 0) {
      return 'PARTIAL';
    }

    return 'PENDING';
  }

  formatMoney(amount?: number | null): string {
    return `Rs. ${Number(amount || 0).toLocaleString()}`;
  }

  formatDisplayDate(date?: string | null): string {
    if (!date) {
      return 'Not added';
    }

    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  }

  isInvalid(controlName: keyof typeof this.feeForm.controls): boolean {
    const control = this.feeForm.controls[controlName];
    return control.invalid && control.touched;
  }

  private buildFeePayload(): CreateFeePayload {
    const formValue = this.feeForm.getRawValue();

    const payload: CreateFeePayload = {
      receiptNo: formValue.receiptNo.trim(),
      studentName: formValue.studentName.trim(),
      className: formValue.className.trim(),
      feeType: formValue.feeType,
      amount: Number(formValue.amount || 0),
      paidAmount: Number(formValue.paidAmount || 0),
      paymentStatus: this.getCurrentPaymentStatus(),
    };

    if (formValue.studentAdmissionNo.trim()) {
      payload.studentAdmissionNo = formValue.studentAdmissionNo.trim();
    }

    if (formValue.section.trim()) {
      payload.section = formValue.section.trim();
    }

    if (formValue.dueDate.trim()) {
      payload.dueDate = formValue.dueDate.trim();
    }

    if (formValue.paidDate.trim()) {
      payload.paidDate = formValue.paidDate.trim();
    }

    if (formValue.paymentMethod) {
      payload.paymentMethod = formValue.paymentMethod;
    }

    if (formValue.notes.trim()) {
      payload.notes = formValue.notes.trim();
    }

    return payload;
  }

  private formatDateForInput(date?: string | null): string {
    if (!date) {
      return '';
    }

    return new Date(date).toISOString().split('T')[0];
  }

  private resetSuggestionState(): void {
    this.studentSearchTerm.set('');
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
