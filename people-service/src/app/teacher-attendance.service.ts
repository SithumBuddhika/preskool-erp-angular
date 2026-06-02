import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTeacherAttendanceDto } from './dto/create-teacher-attendance.dto';
import { UpdateTeacherAttendanceDto } from './dto/update-teacher-attendance.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class TeacherAttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.teacherAttendance.findMany({
      where: search
        ? {
            OR: [
              { attendanceCode: { contains: search, mode: 'insensitive' } },
              {
                teacherEmployeeNo: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              { teacherName: { contains: search, mode: 'insensitive' } },
              { subject: { contains: search, mode: 'insensitive' } },
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
    const attendance = await this.prisma.teacherAttendance.findUnique({
      where: { id },
    });

    if (!attendance) {
      throw new NotFoundException('Teacher attendance record not found');
    }

    return attendance;
  }

  async generateNextCode() {
    const records = await this.prisma.teacherAttendance.findMany({
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
      attendanceCode: `TATT-${String(highestNumber + 1).padStart(4, '0')}`,
    };
  }

  async create(createTeacherAttendanceDto: CreateTeacherAttendanceDto) {
    await this.validateUniqueAttendanceCode(
      createTeacherAttendanceDto.attendanceCode,
    );

    await this.validateDuplicateTeacherAttendance(
      createTeacherAttendanceDto.teacherEmployeeNo,
      createTeacherAttendanceDto.attendanceDate,
    );

    return this.prisma.teacherAttendance.create({
      data: {
        attendanceCode: createTeacherAttendanceDto.attendanceCode.trim(),
        teacherEmployeeNo:
          createTeacherAttendanceDto.teacherEmployeeNo?.trim() || null,
        teacherName: createTeacherAttendanceDto.teacherName.trim(),
        subject: createTeacherAttendanceDto.subject?.trim() || null,
        attendanceDate: new Date(createTeacherAttendanceDto.attendanceDate),
        status: createTeacherAttendanceDto.status,
        checkInTime: createTeacherAttendanceDto.checkInTime?.trim() || null,
        checkOutTime: createTeacherAttendanceDto.checkOutTime?.trim() || null,
        remarks: createTeacherAttendanceDto.remarks?.trim() || null,
      },
    });
  }

  async update(
    id: string,
    updateTeacherAttendanceDto: UpdateTeacherAttendanceDto,
  ) {
    const existingAttendance = await this.findOne(id);

    if (updateTeacherAttendanceDto.attendanceCode) {
      await this.validateUniqueAttendanceCode(
        updateTeacherAttendanceDto.attendanceCode,
        id,
      );
    }

    const nextTeacherEmployeeNo =
      updateTeacherAttendanceDto.teacherEmployeeNo ??
      existingAttendance.teacherEmployeeNo ??
      undefined;

    const nextAttendanceDate =
      updateTeacherAttendanceDto.attendanceDate ||
      existingAttendance.attendanceDate.toISOString();

    await this.validateDuplicateTeacherAttendance(
      nextTeacherEmployeeNo,
      nextAttendanceDate,
      id,
    );

    return this.prisma.teacherAttendance.update({
      where: { id },
      data: {
        attendanceCode: updateTeacherAttendanceDto.attendanceCode?.trim(),
        teacherEmployeeNo:
          updateTeacherAttendanceDto.teacherEmployeeNo !== undefined
            ? updateTeacherAttendanceDto.teacherEmployeeNo?.trim() || null
            : undefined,
        teacherName: updateTeacherAttendanceDto.teacherName?.trim(),
        subject:
          updateTeacherAttendanceDto.subject !== undefined
            ? updateTeacherAttendanceDto.subject?.trim() || null
            : undefined,
        attendanceDate:
          updateTeacherAttendanceDto.attendanceDate !== undefined
            ? new Date(updateTeacherAttendanceDto.attendanceDate)
            : undefined,
        status: updateTeacherAttendanceDto.status,
        checkInTime:
          updateTeacherAttendanceDto.checkInTime !== undefined
            ? updateTeacherAttendanceDto.checkInTime?.trim() || null
            : undefined,
        checkOutTime:
          updateTeacherAttendanceDto.checkOutTime !== undefined
            ? updateTeacherAttendanceDto.checkOutTime?.trim() || null
            : undefined,
        remarks:
          updateTeacherAttendanceDto.remarks !== undefined
            ? updateTeacherAttendanceDto.remarks?.trim() || null
            : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.teacherAttendance.delete({
      where: { id },
    });

    return {
      message: 'Teacher attendance record deleted successfully',
    };
  }

  private async validateUniqueAttendanceCode(
    attendanceCode: string,
    ignoreAttendanceId?: string,
  ) {
    const existingRecord = await this.prisma.teacherAttendance.findUnique({
      where: {
        attendanceCode: attendanceCode.trim(),
      },
    });

    if (existingRecord && existingRecord.id !== ignoreAttendanceId) {
      throw new BadRequestException('Teacher attendance ID already exists');
    }
  }

  private async validateDuplicateTeacherAttendance(
    teacherEmployeeNo?: string | null,
    attendanceDate?: string,
    ignoreAttendanceId?: string,
  ) {
    if (!teacherEmployeeNo || !attendanceDate) {
      return;
    }

    const existingRecord = await this.prisma.teacherAttendance.findFirst({
      where: {
        teacherEmployeeNo: teacherEmployeeNo.trim(),
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
        'Attendance for this teacher already exists on this date',
      );
    }
  }
}
