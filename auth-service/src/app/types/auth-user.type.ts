import { UserRole } from '../../../../generated/prisma/enums';

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  twoStepEnabled: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
};

export type LoginOtpRequiredResponse = {
  otpRequired: true;
  email: string;
  message: string;
};

export type LoginResponse = AuthResponse | LoginOtpRequiredResponse;
