export type PayrollStatus = 'PENDING' | 'PAID' | 'FAILED';

export type Payroll = {
  id: string;
  payrollCode: string;
  staffCode?: string | null;
  staffName: string;
  department?: string | null;
  designation?: string | null;
  salaryMonth: string;
  basicSalary: number;
  allowance: number;
  deduction: number;
  netSalary: number;
  status: PayrollStatus;
  paymentDate?: string | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreatePayrollPayload = {
  payrollCode: string;
  staffCode?: string;
  staffName: string;
  department?: string;
  designation?: string;
  salaryMonth: string;
  basicSalary: number;
  allowance?: number;
  deduction?: number;
  status?: PayrollStatus;
  paymentDate?: string;
  remarks?: string;
};
