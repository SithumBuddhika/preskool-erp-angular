import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.student.findMany({
      where: search
        ? {
            OR: [
              { admissionNo: { contains: search, mode: 'insensitive' } },
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { className: { contains: search, mode: 'insensitive' } },
              { guardianName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  async create(createStudentDto: CreateStudentDto) {
    await this.validateUniqueStudent(
      createStudentDto.admissionNo,
      createStudentDto.email,
    );

    return this.prisma.student.create({
      data: {
        admissionNo: createStudentDto.admissionNo.trim(),
        firstName: createStudentDto.firstName.trim(),
        lastName: createStudentDto.lastName.trim(),
        email: createStudentDto.email?.toLowerCase().trim() || null,
        phone: createStudentDto.phone?.trim() || null,
        gender: createStudentDto.gender,
        dateOfBirth: createStudentDto.dateOfBirth
          ? new Date(createStudentDto.dateOfBirth)
          : null,
        className: createStudentDto.className.trim(),
        section: createStudentDto.section?.trim() || null,
        guardianName: createStudentDto.guardianName.trim(),
        guardianPhone: createStudentDto.guardianPhone.trim(),
        address: createStudentDto.address?.trim() || null,
        status: createStudentDto.status || 'ACTIVE',
      },
    });
  }

  async update(id: string, updateStudentDto: UpdateStudentDto) {
    await this.findOne(id);

    if (updateStudentDto.admissionNo || updateStudentDto.email) {
      await this.validateUniqueStudent(
        updateStudentDto.admissionNo,
        updateStudentDto.email,
        id,
      );
    }

    return this.prisma.student.update({
      where: { id },
      data: {
        admissionNo: updateStudentDto.admissionNo?.trim(),
        firstName: updateStudentDto.firstName?.trim(),
        lastName: updateStudentDto.lastName?.trim(),
        email: updateStudentDto.email?.toLowerCase().trim(),
        phone: updateStudentDto.phone?.trim(),
        gender: updateStudentDto.gender,
        dateOfBirth: updateStudentDto.dateOfBirth
          ? new Date(updateStudentDto.dateOfBirth)
          : undefined,
        className: updateStudentDto.className?.trim(),
        section: updateStudentDto.section?.trim(),
        guardianName: updateStudentDto.guardianName?.trim(),
        guardianPhone: updateStudentDto.guardianPhone?.trim(),
        address: updateStudentDto.address?.trim(),
        status: updateStudentDto.status,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.student.delete({
      where: { id },
    });

    return {
      message: 'Student deleted successfully',
    };
  }

  private async validateUniqueStudent(
    admissionNo?: string,
    email?: string,
    ignoreStudentId?: string,
  ) {
    if (admissionNo) {
      const existingAdmissionNo = await this.prisma.student.findUnique({
        where: {
          admissionNo: admissionNo.trim(),
        },
      });

      if (existingAdmissionNo && existingAdmissionNo.id !== ignoreStudentId) {
        throw new BadRequestException('Admission number already exists');
      }
    }

    if (email) {
      const existingEmail = await this.prisma.student.findUnique({
        where: {
          email: email.toLowerCase().trim(),
        },
      });

      if (existingEmail && existingEmail.id !== ignoreStudentId) {
        throw new BadRequestException('Email already exists');
      }
    }
  }
}
