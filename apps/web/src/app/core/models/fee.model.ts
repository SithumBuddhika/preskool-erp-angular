export type FeeType =
  | 'ADMISSION'
  | 'TUITION'
  | 'EXAM'
  | 'LIBRARY'
  | 'TRANSPORT'
  | 'ACTIVITY'
  | 'OTHER';

export type FeePaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID';

export type FeePaymentMethod =
  | 'CASH'
  | 'CARD'
  | 'BANK_TRANSFER'
  | 'ONLINE'
  | 'CHEQUE';

export type Fee = {
  id: string;
  receiptNo: string;
  studentAdmissionNo?: string | null;
  studentName: string;
  className: string;
  section?: string | null;
  feeType: FeeType;
  amount: number;
  paidAmount: number;
  balance: number;
  dueDate?: string | null;
  paidDate?: string | null;
  paymentStatus: FeePaymentStatus;
  paymentMethod?: FeePaymentMethod | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateFeePayload = {
  receiptNo: string;
  studentAdmissionNo?: string;
  studentName: string;
  className: string;
  section?: string;
  feeType: FeeType;
  amount: number;
  paidAmount?: number;
  dueDate?: string;
  paidDate?: string;
  paymentStatus?: FeePaymentStatus;
  paymentMethod?: FeePaymentMethod;
  notes?: string;
};
