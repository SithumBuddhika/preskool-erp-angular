export type DesignationStatus = 'ACTIVE' | 'INACTIVE';

export type Designation = {
  id: string;
  designationCode: string;
  designationName: string;
  departmentCode?: string | null;
  departmentName?: string | null;
  description?: string | null;
  status: DesignationStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateDesignationPayload = {
  designationCode: string;
  designationName: string;
  departmentCode?: string;
  departmentName?: string;
  description?: string;
  status?: DesignationStatus;
};
