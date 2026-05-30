export type StudentGender = 'MALE' | 'FEMALE' | 'OTHER';

export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'SUSPENDED';

export type Student = {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  gender: StudentGender;
  dateOfBirth?: string | null;
  className: string;
  section?: string | null;
  guardianName: string;
  guardianPhone: string;
  address?: string | null;
  status: StudentStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateStudentPayload = {
  admissionNo: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  gender: StudentGender;
  dateOfBirth?: string;
  className: string;
  section?: string;
  guardianName: string;
  guardianPhone: string;
  address?: string;
  status?: StudentStatus;
};
