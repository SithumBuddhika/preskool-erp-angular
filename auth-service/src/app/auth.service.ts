import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes, randomInt, createHash } from 'crypto';
import { UserRole } from '../../../generated/prisma/enums';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateAdminStatusDto } from './dto/update-admin-status.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { VerifyLoginOtpDto } from './dto/verify-login-otp.dto';
import { MailService } from './mail.service';
import { PrismaService } from './prisma.service';
import { UpdateAdminTwoStepDto } from './dto/update-admin-two-step.dto';
import { AuthResponse, AuthUser, LoginResponse } from './types/auth-user.type';

type DbUser = AuthUser & {
  passwordHash: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const email = registerDto.email.toLowerCase().trim();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        fullName: registerDto.fullName.trim(),
        email,
        passwordHash,
        role: 'ADMIN',
        isActive: true,
        twoStepEnabled: false,
        emailVerified: false,
      },
    });

    return this.createAuthResponse(user as DbUser);
  }

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const email = loginDto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.twoStepEnabled) {
      return this.createAuthResponse(user as DbUser);
    }

    const otp = this.generateOtp();
    const otpHash = this.hashToken(otp);

    await this.prisma.loginOtp.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    await this.prisma.loginOtp.create({
      data: {
        userId: user.id,
        otpHash,
        expiresAt: this.addMinutes(10),
      },
    });

    await this.mailService.sendLoginOtpEmail(user.email, user.fullName, otp);

    return {
      otpRequired: true,
      email: user.email,
      message: 'OTP sent to your email address.',
    };
  }

  async verifyLoginOtp(
    verifyLoginOtpDto: VerifyLoginOtpDto,
  ): Promise<AuthResponse> {
    const email = verifyLoginOtpDto.email.toLowerCase().trim();
    const otpHash = this.hashToken(verifyLoginOtpDto.otp.trim());

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid verification code');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account is inactive');
    }

    const otpRecord = await this.prisma.loginOtp.findFirst({
      where: {
        userId: user.id,
        otpHash,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    await this.prisma.loginOtp.update({
      where: { id: otpRecord.id },
      data: {
        usedAt: new Date(),
      },
    });

    return this.createAuthResponse(user as DbUser);
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const email = forgotPasswordDto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    const genericResponse = {
      message:
        'If this email exists in PreSkool ERP, a password reset link has been sent.',
    };

    if (!user || !user.isActive) {
      return genericResponse;
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    await this.prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: this.addMinutes(30),
      },
    });

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';

    const resetLink = `${frontendUrl}/auth/reset-password?token=${rawToken}`;

    await this.mailService.sendPasswordResetEmail(
      user.email,
      user.fullName,
      resetLink,
    );

    return genericResponse;
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const tokenHash = this.hashToken(resetPasswordDto.token.trim());

    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!resetToken || !resetToken.user || !resetToken.user.isActive) {
      throw new BadRequestException('Invalid or expired reset link');
    }

    const passwordHash = await bcrypt.hash(resetPasswordDto.password, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash,
        },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: {
          usedAt: new Date(),
        },
      }),
    ]);

    return {
      message: 'Password reset successfully. You can now login.',
    };
  }

  async getMe(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account is inactive');
    }

    return this.toAuthUser(user as DbUser);
  }

  async findAdminUsers(currentUserId: string) {
    await this.assertCanManageAdmins(currentUserId);

    const users = await this.prisma.user.findMany({
      where: {
        role: {
          in: ['SUPER_ADMIN', 'ADMIN'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map((user) => this.toAuthUser(user as DbUser));
  }

  async createAdminUser(
    currentUserId: string,
    createAdminUserDto: CreateAdminUserDto,
  ) {
    await this.assertCanManageAdmins(currentUserId);

    const email = createAdminUserDto.email.toLowerCase().trim();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Email is already registered');
    }

    const role = createAdminUserDto.role || 'ADMIN';

    this.validateAdminRole(role);

    const passwordHash = await bcrypt.hash(createAdminUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        fullName: createAdminUserDto.fullName.trim(),
        email,
        passwordHash,
        role,
        isActive: true,
        twoStepEnabled: false,
        emailVerified: false,
      },
    });

    return this.toAuthUser(user as DbUser);
  }

  async updateAdminUser(
    currentUserId: string,
    adminUserId: string,
    updateAdminUserDto: UpdateAdminUserDto,
  ) {
    await this.assertCanManageAdmins(currentUserId);

    const targetUser = await this.findUserById(adminUserId);

    this.validateAdminRole(targetUser.role);

    if (updateAdminUserDto.email !== undefined) {
      const email = updateAdminUserDto.email.toLowerCase().trim();

      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== adminUserId) {
        throw new BadRequestException('Email is already registered');
      }
    }

    if (updateAdminUserDto.role !== undefined) {
      this.validateAdminRole(updateAdminUserDto.role);

      if (
        targetUser.id === currentUserId &&
        targetUser.role === 'SUPER_ADMIN'
      ) {
        throw new BadRequestException(
          'You cannot change your own super admin role',
        );
      }
    }

    const passwordHash = updateAdminUserDto.password
      ? await bcrypt.hash(updateAdminUserDto.password, 10)
      : undefined;

    const updatedUser = await this.prisma.user.update({
      where: { id: adminUserId },
      data: {
        fullName:
          updateAdminUserDto.fullName !== undefined
            ? updateAdminUserDto.fullName.trim()
            : undefined,
        email:
          updateAdminUserDto.email !== undefined
            ? updateAdminUserDto.email.toLowerCase().trim()
            : undefined,
        passwordHash,
        role: updateAdminUserDto.role,
      },
    });

    return this.toAuthUser(updatedUser as DbUser);
  }

  async updateAdminStatus(
    currentUserId: string,
    adminUserId: string,
    updateAdminStatusDto: UpdateAdminStatusDto,
  ) {
    await this.assertCanManageAdmins(currentUserId);

    const targetUser = await this.findUserById(adminUserId);

    this.validateAdminRole(targetUser.role);

    if (targetUser.id === currentUserId) {
      throw new BadRequestException('You cannot deactivate your own account');
    }

    if (!updateAdminStatusDto.isActive && targetUser.role === 'SUPER_ADMIN') {
      await this.assertAnotherActiveSuperAdminExists(targetUser.id);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: adminUserId },
      data: {
        isActive: updateAdminStatusDto.isActive,
      },
    });

    return this.toAuthUser(updatedUser as DbUser);
  }

  async updateAdminTwoStep(
    currentUserId: string,
    adminUserId: string,
    updateAdminTwoStepDto: UpdateAdminTwoStepDto,
  ) {
    await this.assertCanManageAdmins(currentUserId);

    const targetUser = await this.findUserById(adminUserId);

    this.validateAdminRole(targetUser.role);

    if (
      updateAdminTwoStepDto.twoStepEnabled &&
      this.isUnsafeDemoEmail(targetUser.email)
    ) {
      throw new BadRequestException(
        '2-step verification requires a real email address. Use a real email or keep 2FA disabled for demo accounts.',
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: adminUserId },
      data: {
        twoStepEnabled: updateAdminTwoStepDto.twoStepEnabled,
        emailVerified: updateAdminTwoStepDto.twoStepEnabled
          ? true
          : targetUser.emailVerified,
      },
    });

    return this.toAuthUser(updatedUser as DbUser);
  }

  async deleteAdminUser(currentUserId: string, adminUserId: string) {
    await this.assertCanManageAdmins(currentUserId);

    const targetUser = await this.findUserById(adminUserId);

    this.validateAdminRole(targetUser.role);

    if (targetUser.id === currentUserId) {
      throw new BadRequestException('You cannot delete your own account');
    }

    if (targetUser.role === 'SUPER_ADMIN') {
      await this.assertAnotherActiveSuperAdminExists(targetUser.id);
    }

    await this.prisma.user.delete({
      where: { id: adminUserId },
    });

    return {
      message: 'Admin user deleted successfully',
    };
  }

  private async createAuthResponse(user: DbUser): Promise<AuthResponse> {
    const authUser = this.toAuthUser(user);

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: authUser,
      accessToken,
    };
  }

  private toAuthUser(user: DbUser): AuthUser {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      twoStepEnabled: user.twoStepEnabled,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private async findUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async assertCanManageAdmins(currentUserId: string) {
    const currentUser = await this.findUserById(currentUserId);

    if (!currentUser.isActive) {
      throw new UnauthorizedException('Your account is inactive');
    }

    if (!['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
      throw new ForbiddenException('You are not allowed to manage admin users');
    }

    return currentUser;
  }

  private validateAdminRole(role: UserRole) {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(role)) {
      throw new BadRequestException('Only admin users can be managed here');
    }
  }

  private async assertAnotherActiveSuperAdminExists(ignoreUserId: string) {
    const activeSuperAdmins = await this.prisma.user.count({
      where: {
        role: 'SUPER_ADMIN',
        isActive: true,
        id: {
          not: ignoreUserId,
        },
      },
    });

    if (activeSuperAdmins === 0) {
      throw new BadRequestException(
        'At least one active super admin must remain',
      );
    }
  }

  private generateOtp(): string {
    return String(randomInt(100000, 1000000));
  }

  private hashToken(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private addMinutes(minutes: number): Date {
    const date = new Date();

    date.setMinutes(date.getMinutes() + minutes);

    return date;
  }

  private isUnsafeDemoEmail(email: string): boolean {
    const normalizedEmail = email.toLowerCase().trim();

    return (
      normalizedEmail.endsWith('@example.com') ||
      normalizedEmail.endsWith('@test.com') ||
      normalizedEmail.endsWith('@localhost') ||
      normalizedEmail.includes('example.')
    );
  }
}
