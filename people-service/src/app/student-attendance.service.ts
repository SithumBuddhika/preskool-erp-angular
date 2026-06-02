import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateStudentAttendanceDto } from './dto/create-student-attendance.dto';
import { UpdateStudentAttendanceDto } from './dto/update-student-attendance.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class StudentAttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.studentAttendance.findMany({
      where: search
        ? {
            OR: [
              { attendanceCode: { contains: search, mode: 'insensitive' } },
              {
                studentAdmissionNo: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              { studentName: { contains: search, mode: 'insensitive' } },
              { className: { contains: search, mode: 'insensitive' } },
              { section: { contains: search, mode: 'insensitive' } },
              { remarks: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: {
        attendanceDate: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const attendance = await this.prisma.studentAttendance.findUnique({
      where: { id },
    });

    if (!attendance) {
      throw new NotFoundException('Student attendance record not found');
    }

    return attendance;
  }

  async generateNextCode() {
    const records = await this.prisma.studentAttendance.findMany({
      select: {
        attendanceCode: true,
      },
    });

    const highestNumber = records.reduce((highest, record) => {
      const match = record.attendanceCode.match(/\d+/);
      const codeNumber = match ? Number(match[0]) : 0;

      return codeNumber > highest ? codeNumber : highest;
    }, 0);

    return {
      attendanceCode: `ATT-${String(highestNumber + 1).padStart(4, '0')}`,
    };
  }

  async create(createStudentAttendanceDto: CreateStudentAttendanceDto) {
    await this.validateUniqueAttendanceCode(
      createStudentAttendanceDto.attendanceCode,
    );

    await this.validateDuplicateStudentAttendance(
      createStudentAttendanceDto.studentAdmissionNo,
      createStudentAttendanceDto.attendanceDate,
    );

    return this.prisma.studentAttendance.create({
      data: {
        attendanceCode: createStudentAttendanceDto.attendanceCode.trim(),
        studentAdmissionNo:
          createStudentAttendanceDto.studentAdmissionNo?.trim() || null,
        studentName: createStudentAttendanceDto.studentName.trim(),
        className: createStudentAttendanceDto.className.trim(),
        section: createStudentAttendanceDto.section?.trim() || null,
        attendanceDate: new Date(createStudentAttendanceDto.attendanceDate),
        status: createStudentAttendanceDto.status,
        checkInTime: createStudentAttendanceDto.checkInTime?.trim() || null,
        checkOutTime: createStudentAttendanceDto.checkOutTime?.trim() || null,
        remarks: createStudentAttendanceDto.remarks?.trim() || null,
      },
    });
  }

  async update(
    id: string,
    updateStudentAttendanceDto: UpdateStudentAttendanceDto,
  ) {
    const existingAttendance = await this.findOne(id);

    if (updateStudentAttendanceDto.attendanceCode) {
      await this.validateUniqueAttendanceCode(
        updateStudentAttendanceDto.attendanceCode,
        id,
      );
    }

    const nextStudentAdmissionNo =
      updateStudentAttendanceDto.studentAdmissionNo ??
      existingAttendance.studentAdmissionNo ??
      undefined;

    const nextAttendanceDate =
      updateStudentAttendanceDto.attendanceDate ||
      existingAttendance.attendanceDate.toISOString();

    await this.validateDuplicateStudentAttendance(
      nextStudentAdmissionNo,
      nextAttendanceDate,
      id,
    );

    return this.prisma.studentAttendance.update({
      where: { id },
      data: {
        attendanceCode: updateStudentAttendanceDto.attendanceCode?.trim(),
        studentAdmissionNo:
          updateStudentAttendanceDto.studentAdmissionNo !== undefined
            ? updateStudentAttendanceDto.studentAdmissionNo?.trim() || null
            : undefined,
        studentName: updateStudentAttendanceDto.studentName?.trim(),
        className: updateStudentAttendanceDto.className?.trim(),
        section:
          updateStudentAttendanceDto.section !== undefined
            ? updateStudentAttendanceDto.section?.trim() || null
            : undefined,
        attendanceDate:
          updateStudentAttendanceDto.attendanceDate !== undefined
            ? new Date(updateStudentAttendanceDto.attendanceDate)
            : undefined,
        status: updateStudentAttendanceDto.status,
        checkInTime:
          updateStudentAttendanceDto.checkInTime !== undefined
            ? updateStudentAttendanceDto.checkInTime?.trim() || null
            : undefined,
        checkOutTime:
          updateStudentAttendanceDto.checkOutTime !== undefined
            ? updateStudentAttendanceDto.checkOutTime?.trim() || null
            : undefined,
        remarks:
          updateStudentAttendanceDto.remarks !== undefined
            ? updateStudentAttendanceDto.remarks?.trim() || null
            : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.studentAttendance.delete({
      where: { id },
    });

    return {
      message: 'Student attendance record deleted successfully',
    };
  }

  private async validateUniqueAttendanceCode(
    attendanceCode: string,
    ignoreAttendanceId?: string,
  ) {
    const existingRecord = await this.prisma.studentAttendance.findUnique({
      where: {
        attendanceCode: attendanceCode.trim(),
      },
    });

    if (existingRecord && existingRecord.id !== ignoreAttendanceId) {
      throw new BadRequestException('Attendance ID already exists');
    }
  }

  private async validateDuplicateStudentAttendance(
    studentAdmissionNo?: string | null,
    attendanceDate?: string,
    ignoreAttendanceId?: string,
  ) {
    if (!studentAdmissionNo || !attendanceDate) {
      return;
    }

    const existingRecord = await this.prisma.studentAttendance.findFirst({
      where: {
        studentAdmissionNo: studentAdmissionNo.trim(),
        attendanceDate: new Date(attendanceDate),
        NOT: ignoreAttendanceId
          ? {
              id: ignoreAttendanceId,
            }
          : undefined,
      },
    });

    if (existingRecord) {
      throw new BadRequestException(
        'Attendance for this student already exists on this date',
      );
    }
  }
}
