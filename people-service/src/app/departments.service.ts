import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.department.findMany({
      where: search
        ? {
            OR: [
              { departmentCode: { contains: search, mode: 'insensitive' } },
              { departmentName: { contains: search, mode: 'insensitive' } },
              { headOfDepartment: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { location: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return department;
  }

  async generateNextCode() {
    const departments = await this.prisma.department.findMany({
      select: {
        departmentCode: true,
      },
    });

    const highestNumber = departments.reduce((highest, department) => {
      const match = department.departmentCode.match(/\d+/);
      const codeNumber = match ? Number(match[0]) : 0;

      return codeNumber > highest ? codeNumber : highest;
    }, 0);

    return {
      departmentCode: `DPT-${String(highestNumber + 1).padStart(4, '0')}`,
    };
  }

  async create(createDepartmentDto: CreateDepartmentDto) {
    await this.validateUniqueDepartmentCode(createDepartmentDto.departmentCode);

    return this.prisma.department.create({
      data: {
        departmentCode: createDepartmentDto.departmentCode.trim(),
        departmentName: createDepartmentDto.departmentName.trim(),
        headOfDepartment: createDepartmentDto.headOfDepartment?.trim() || null,
        phone: createDepartmentDto.phone?.trim() || null,
        email: createDepartmentDto.email?.toLowerCase().trim() || null,
        location: createDepartmentDto.location?.trim() || null,
        description: createDepartmentDto.description?.trim() || null,
        status: createDepartmentDto.status || 'ACTIVE',
      },
    });
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto) {
    await this.findOne(id);

    if (updateDepartmentDto.departmentCode) {
      await this.validateUniqueDepartmentCode(
        updateDepartmentDto.departmentCode,
        id,
      );
    }

    return this.prisma.department.update({
      where: { id },
      data: {
        departmentCode: updateDepartmentDto.departmentCode?.trim(),
        departmentName: updateDepartmentDto.departmentName?.trim(),
        headOfDepartment:
          updateDepartmentDto.headOfDepartment !== undefined
            ? updateDepartmentDto.headOfDepartment?.trim() || null
            : undefined,
        phone:
          updateDepartmentDto.phone !== undefined
            ? updateDepartmentDto.phone?.trim() || null
            : undefined,
        email:
          updateDepartmentDto.email !== undefined
            ? updateDepartmentDto.email?.toLowerCase().trim() || null
            : undefined,
        location:
          updateDepartmentDto.location !== undefined
            ? updateDepartmentDto.location?.trim() || null
            : undefined,
        description:
          updateDepartmentDto.description !== undefined
            ? updateDepartmentDto.description?.trim() || null
            : undefined,
        status: updateDepartmentDto.status,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.department.delete({
      where: { id },
    });

    return {
      message: 'Department deleted successfully',
    };
  }

  private async validateUniqueDepartmentCode(
    departmentCode: string,
    ignoreDepartmentId?: string,
  ) {
    const existingDepartment = await this.prisma.department.findUnique({
      where: {
        departmentCode: departmentCode.trim(),
      },
    });

    if (existingDepartment && existingDepartment.id !== ignoreDepartmentId) {
      throw new BadRequestException('Department ID already exists');
    }
  }
}
