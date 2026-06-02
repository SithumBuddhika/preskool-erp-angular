export type StaffGender = 'MALE' | 'FEMALE' | 'OTHER';

export type StaffEmploymentType =
  | 'FULL_TIME'
  | 'PART_TIME'
  | 'CONTRACT'
  | 'INTERNSHIP';

export type StaffStatus = 'ACTIVE' | 'INACTIVE';

export type Staff = {
  id: string;
  staffCode: string;
  fullName: string;
  email: string;
  phone: string;
  gender: StaffGender;
  departmentCode?: string | null;
  departmentName: string;
  designationCode?: string | null;
  designation: string;
  employmentType: StaffEmploymentType;
  joiningDate: string;
  salary?: number | null;
  address?: string | null;
  status: StaffStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateStaffPayload = {
  staffCode: string;
  fullName: string;
  email: string;
  phone: string;
  gender: StaffGender;
  departmentCode?: string;
  departmentName: string;
  designationCode?: string;
  designation: string;
  employmentType: StaffEmploymentType;
  joiningDate: string;
  salary?: number;
  address?: string;
  status?: StaffStatus;
};
