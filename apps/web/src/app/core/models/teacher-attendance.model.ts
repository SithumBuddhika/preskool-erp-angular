export type TeacherAttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'HALF_DAY';

export type TeacherAttendance = {
  id: string;
  attendanceCode: string;
  teacherEmployeeNo?: string | null;
  teacherName: string;
  subject?: string | null;
  attendanceDate: string;
  status: TeacherAttendanceStatus;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateTeacherAttendancePayload = {
  attendanceCode: string;
  teacherEmployeeNo?: string;
  teacherName: string;
  subject?: string;
  attendanceDate: string;
  status: TeacherAttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  remarks?: string;
};
