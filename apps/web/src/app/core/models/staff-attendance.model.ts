export type StaffAttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';

export type StaffAttendance = {
  id: string;
  staffId?: string | null;
  staffCode: string;
  staffName: string;
  department?: string | null;
  designation?: string | null;
  attendanceDate: string;
  status: StaffAttendanceStatus;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateStaffAttendancePayload = {
  staffId?: string;
  staffCode: string;
  staffName: string;
  department?: string;
  designation?: string;
  attendanceDate: string;
  status: StaffAttendanceStatus;
  remarks?: string;
};
