import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.teacher.findMany({
      where: search
        ? {
            OR: [
              { employeeNo: { contains: search, mode: 'insensitive' } },
              { fullName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { subject: { contains: search, mode: 'insensitive' } },
              { qualification: { contains: search, mode: 'insensitive' } },
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
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return teacher;
  }

  async generateNextCode() {
    const teachers = await this.prisma.teacher.findMany({
      select: {
        employeeNo: true,
      },
    });

    const highestNumber = teachers.reduce((highest, teacher) => {
      const match = teacher.employeeNo.match(/\d+/);
      const codeNumber = match ? Number(match[0]) : 0;

      return codeNumber > highest ? codeNumber : highest;
    }, 0);

    return {
      employeeNo: `TCH-${String(highestNumber + 1).padStart(4, '0')}`,
    };
  }

  async create(createTeacherDto: CreateTeacherDto) {
    await this.validateUniqueEmployeeNo(createTeacherDto.employeeNo);
    await this.validateUniqueEmail(createTeacherDto.email);

    return this.prisma.teacher.create({
      data: {
        employeeNo: createTeacherDto.employeeNo.trim(),
        fullName: createTeacherDto.fullName.trim(),
        email: createTeacherDto.email.toLowerCase().trim(),
        phone: createTeacherDto.phone.trim(),
        gender: createTeacherDto.gender,
        subject: createTeacherDto.subject.trim(),
        qualification: createTeacherDto.qualification?.trim() || null,
        joiningDate: new Date(createTeacherDto.joiningDate),
        address: createTeacherDto.address?.trim() || null,
        status: createTeacherDto.status || 'ACTIVE',
      },
    });
  }

  async update(id: string, updateTeacherDto: UpdateTeacherDto) {
    await this.findOne(id);

    if (updateTeacherDto.employeeNo) {
      await this.validateUniqueEmployeeNo(updateTeacherDto.employeeNo, id);
    }

    if (updateTeacherDto.email) {
      await this.validateUniqueEmail(updateTeacherDto.email, id);
    }

    return this.prisma.teacher.update({
      where: { id },
      data: {
        employeeNo: updateTeacherDto.employeeNo?.trim(),
        fullName: updateTeacherDto.fullName?.trim(),
        email:
          updateTeacherDto.email !== undefined
            ? updateTeacherDto.email.toLowerCase().trim()
            : undefined,
        phone: updateTeacherDto.phone?.trim(),
        gender: updateTeacherDto.gender,
        subject: updateTeacherDto.subject?.trim(),
        qualification:
          updateTeacherDto.qualification !== undefined
            ? updateTeacherDto.qualification?.trim() || null
            : undefined,
        joiningDate:
          updateTeacherDto.joiningDate !== undefined
            ? new Date(updateTeacherDto.joiningDate)
            : undefined,
        address:
          updateTeacherDto.address !== undefined
            ? updateTeacherDto.address?.trim() || null
            : undefined,
        status: updateTeacherDto.status,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.teacher.delete({
      where: { id },
    });

    return {
      message: 'Teacher deleted successfully',
    };
  }

  private async validateUniqueEmployeeNo(
    employeeNo: string,
    ignoreTeacherId?: string,
  ) {
    const existingTeacher = await this.prisma.teacher.findUnique({
      where: {
        employeeNo: employeeNo.trim(),
      },
    });

    if (existingTeacher && existingTeacher.id !== ignoreTeacherId) {
      throw new BadRequestException('Employee number already exists');
    }
  }

  private async validateUniqueEmail(email: string, ignoreTeacherId?: string) {
    const existingTeacher = await this.prisma.teacher.findUnique({
      where: {
        email: email.toLowerCase().trim(),
      },
    });

    if (existingTeacher && existingTeacher.id !== ignoreTeacherId) {
      throw new BadRequestException('Email already exists');
    }
  }
}
