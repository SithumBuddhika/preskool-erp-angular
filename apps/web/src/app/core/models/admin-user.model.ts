export type AdminUserRole = 'SUPER_ADMIN' | 'ADMIN';

export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  role: AdminUserRole;
  isActive: boolean;
  twoStepEnabled: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateAdminUserPayload = {
  fullName: string;
  email: string;
  password: string;
  role?: AdminUserRole;
};

export type UpdateAdminUserPayload = {
  fullName?: string;
  email?: string;
  password?: string;
  role?: AdminUserRole;
};

export type UpdateAdminStatusPayload = {
  isActive: boolean;
};

export type UpdateAdminTwoStepPayload = {
  twoStepEnabled: boolean;
};
