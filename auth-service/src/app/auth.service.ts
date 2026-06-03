import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '../../../generated/prisma/enums';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateAdminStatusDto } from './dto/update-admin-status.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { PrismaService } from './prisma.service';
import { AuthResponse, AuthUser } from './types/auth-user.type';

type DbUser = AuthUser & {
  passwordHash: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
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
      },
    });

    return this.createAuthResponse(user as DbUser);
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
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

    return this.createAuthResponse(user as DbUser);
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
}
