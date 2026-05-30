export type TeacherGender = 'MALE' | 'FEMALE' | 'OTHER';

export type TeacherStatus = 'ACTIVE' | 'INACTIVE';

export type Teacher = {
  id: string;
  employeeNo: string;
  fullName: string;
  email: string;
  phone: string;
  gender: TeacherGender;
  subject: string;
  qualification?: string | null;
  joiningDate: string;
  address?: string | null;
  status: TeacherStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateTeacherPayload = {
  employeeNo: string;
  fullName: string;
  email: string;
  phone: string;
  gender: TeacherGender;
  subject: string;
  qualification?: string;
  joiningDate: string;
  address?: string;
  status?: TeacherStatus;
};
