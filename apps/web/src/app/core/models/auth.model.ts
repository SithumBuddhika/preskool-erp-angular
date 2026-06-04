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
  twoStepEnabled: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
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

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type VerifyLoginOtpPayload = {
  email: string;
  otp: string;
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

export function isOtpRequiredResponse(
  response: LoginResponse,
): response is LoginOtpRequiredResponse {
  return 'otpRequired' in response && response.otpRequired === true;
}
