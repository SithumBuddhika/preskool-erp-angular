export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'TEACHER'
  | 'STUDENT'
  | 'PARENT'
  | 'STAFF';

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
};

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  token: string;
  password: string;
};

export type AuthMessageResponse = {
  message: string;
};
