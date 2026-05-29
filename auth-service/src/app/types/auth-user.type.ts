import { UserRole } from '../../../../generated/prisma/enums';

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
};
