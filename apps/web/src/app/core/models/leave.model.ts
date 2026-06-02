export type LeaveType =
  | 'SICK'
  | 'CASUAL'
  | 'ANNUAL'
  | 'MATERNITY'
  | 'EMERGENCY'
  | 'OTHER';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type StaffLeave = {
  id: string;
  leaveCode: string;
  staffCode?: string | null;
  staffName: string;
  departmentCode?: string | null;
  departmentName?: string | null;
  designationCode?: string | null;
  designation?: string | null;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  approvedBy?: string | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateLeavePayload = {
  leaveCode: string;
  staffCode?: string;
  staffName: string;
  departmentCode?: string;
  departmentName?: string;
  designationCode?: string;
  designation?: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status?: LeaveStatus;
  approvedBy?: string;
  remarks?: string;
};
