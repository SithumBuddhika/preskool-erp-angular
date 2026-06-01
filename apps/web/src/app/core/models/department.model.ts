export type DepartmentStatus = 'ACTIVE' | 'INACTIVE';

export type Department = {
  id: string;
  departmentCode: string;
  departmentName: string;
  headOfDepartment?: string | null;
  phone?: string | null;
  email?: string | null;
  location?: string | null;
  description?: string | null;
  status: DepartmentStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateDepartmentPayload = {
  departmentCode: string;
  departmentName: string;
  headOfDepartment?: string;
  phone?: string;
  email?: string;
  location?: string;
  description?: string;
  status?: DepartmentStatus;
};
