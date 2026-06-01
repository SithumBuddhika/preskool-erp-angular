import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class StaffsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.staff.findMany({
      where: search
        ? {
            OR: [
              { staffCode: { contains: search, mode: 'insensitive' } },
              { fullName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { departmentCode: { contains: search, mode: 'insensitive' } },
              { departmentName: { contains: search, mode: 'insensitive' } },
              { designation: { contains: search, mode: 'insensitive' } },
              { address: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
    });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    return staff;
  }

  async generateNextCode() {
    const staffs = await this.prisma.staff.findMany({
      select: {
        staffCode: true,
      },
    });

    const highestNumber = staffs.reduce((highest, staff) => {
      const match = staff.staffCode.match(/\d+/);
      const codeNumber = match ? Number(match[0]) : 0;

      return codeNumber > highest ? codeNumber : highest;
    }, 0);

    return {
      staffCode: `STF-${String(highestNumber + 1).padStart(4, '0')}`,
    };
  }

  async create(createStaffDto: CreateStaffDto) {
    await this.validateUniqueStaffCode(createStaffDto.staffCode);
    await this.validateUniqueEmail(createStaffDto.email);

    return this.prisma.staff.create({
      data: {
        staffCode: createStaffDto.staffCode.trim(),
        fullName: createStaffDto.fullName.trim(),
        email: createStaffDto.email.toLowerCase().trim(),
        phone: createStaffDto.phone.trim(),
        gender: createStaffDto.gender,
        departmentCode: createStaffDto.departmentCode?.trim() || null,
        departmentName: createStaffDto.departmentName.trim(),
        designation: createStaffDto.designation.trim(),
        employmentType: createStaffDto.employmentType,
        joiningDate: new Date(createStaffDto.joiningDate),
        salary: createStaffDto.salary ?? null,
        address: createStaffDto.address?.trim() || null,
        status: createStaffDto.status || 'ACTIVE',
      },
    });
  }

  async update(id: string, updateStaffDto: UpdateStaffDto) {
    await this.findOne(id);

    if (updateStaffDto.staffCode) {
      await this.validateUniqueStaffCode(updateStaffDto.staffCode, id);
    }

    if (updateStaffDto.email) {
      await this.validateUniqueEmail(updateStaffDto.email, id);
    }

    return this.prisma.staff.update({
      where: { id },
      data: {
        staffCode: updateStaffDto.staffCode?.trim(),
        fullName: updateStaffDto.fullName?.trim(),
        email:
          updateStaffDto.email !== undefined
            ? updateStaffDto.email.toLowerCase().trim()
            : undefined,
        phone: updateStaffDto.phone?.trim(),
        gender: updateStaffDto.gender,
        departmentCode:
          updateStaffDto.departmentCode !== undefined
            ? updateStaffDto.departmentCode?.trim() || null
            : undefined,
        departmentName: updateStaffDto.departmentName?.trim(),
        designation: updateStaffDto.designation?.trim(),
        employmentType: updateStaffDto.employmentType,
        joiningDate:
          updateStaffDto.joiningDate !== undefined
            ? new Date(updateStaffDto.joiningDate)
            : undefined,
        salary:
          updateStaffDto.salary !== undefined
            ? updateStaffDto.salary
            : undefined,
        address:
          updateStaffDto.address !== undefined
            ? updateStaffDto.address?.trim() || null
            : undefined,
        status: updateStaffDto.status,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.staff.delete({
      where: { id },
    });

    return {
      message: 'Staff deleted successfully',
    };
  }

  private async validateUniqueStaffCode(
    staffCode: string,
    ignoreStaffId?: string,
  ) {
    const existingStaff = await this.prisma.staff.findUnique({
      where: {
        staffCode: staffCode.trim(),
      },
    });

    if (existingStaff && existingStaff.id !== ignoreStaffId) {
      throw new BadRequestException('Staff ID already exists');
    }
  }

  private async validateUniqueEmail(email: string, ignoreStaffId?: string) {
    const existingStaff = await this.prisma.staff.findUnique({
      where: {
        email: email.toLowerCase().trim(),
      },
    });

    if (existingStaff && existingStaff.id !== ignoreStaffId) {
      throw new BadRequestException('Email already exists');
    }
  }
}
