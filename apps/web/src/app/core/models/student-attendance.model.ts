export type StudentAttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'HALF_DAY';

export type StudentAttendance = {
  id: string;
  attendanceCode: string;
  studentAdmissionNo?: string | null;
  studentName: string;
  className: string;
  section?: string | null;
  attendanceDate: string;
  status: StudentAttendanceStatus;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateStudentAttendancePayload = {
  attendanceCode: string;
  studentAdmissionNo?: string;
  studentName: string;
  className: string;
  section?: string;
  attendanceDate: string;
  status: StudentAttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  remarks?: string;
};
