import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StaffAttendanceStatus } from '../../../generated/prisma/enums';
import { CreateStaffAttendanceDto } from './dto/create-staff-attendance.dto';
import { UpdateStaffAttendanceDto } from './dto/update-staff-attendance.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class StaffAttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string, date?: string) {
    const keyword = search?.trim();
    const dateFilter = date ? this.getDateRange(date) : null;

    return this.prisma.staffAttendance.findMany({
      where: {
        AND: [
          keyword
            ? {
                OR: [
                  { staffCode: { contains: keyword, mode: 'insensitive' } },
                  { staffName: { contains: keyword, mode: 'insensitive' } },
                  { department: { contains: keyword, mode: 'insensitive' } },
                  { designation: { contains: keyword, mode: 'insensitive' } },
                  { remarks: { contains: keyword, mode: 'insensitive' } },
                ],
              }
            : {},
          dateFilter
            ? {
                attendanceDate: {
                  gte: dateFilter.start,
                  lt: dateFilter.end,
                },
              }
            : {},
        ],
      },
      orderBy: [
        {
          attendanceDate: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });
  }

  async findOne(id: string) {
    const attendance = await this.prisma.staffAttendance.findUnique({
      where: { id },
    });

    if (!attendance) {
      throw new NotFoundException('Staff attendance record not found');
    }

    return attendance;
  }

  async create(createStaffAttendanceDto: CreateStaffAttendanceDto) {
    const staffCode = createStaffAttendanceDto.staffCode.trim();
    const attendanceDate = this.parseDate(
      createStaffAttendanceDto.attendanceDate,
    );

    await this.validateDuplicateAttendance(staffCode, attendanceDate);

    return this.prisma.staffAttendance.create({
      data: {
        staffId: this.emptyToNull(createStaffAttendanceDto.staffId),
        staffCode,
        staffName: createStaffAttendanceDto.staffName.trim(),
        department: this.emptyToNull(createStaffAttendanceDto.department),
        designation: this.emptyToNull(createStaffAttendanceDto.designation),
        attendanceDate,
        status: createStaffAttendanceDto.status,
        remarks: this.emptyToNull(createStaffAttendanceDto.remarks),
      },
    });
  }

  async update(id: string, updateStaffAttendanceDto: UpdateStaffAttendanceDto) {
    const existingAttendance = await this.findOne(id);

    const nextStaffCode =
      updateStaffAttendanceDto.staffCode?.trim() ||
      existingAttendance.staffCode;

    const nextAttendanceDate = updateStaffAttendanceDto.attendanceDate
      ? this.parseDate(updateStaffAttendanceDto.attendanceDate)
      : existingAttendance.attendanceDate;

    await this.validateDuplicateAttendance(
      nextStaffCode,
      nextAttendanceDate,
      id,
    );

    return this.prisma.staffAttendance.update({
      where: { id },
      data: {
        staffId:
          updateStaffAttendanceDto.staffId !== undefined
            ? this.emptyToNull(updateStaffAttendanceDto.staffId)
            : undefined,

        staffCode:
          updateStaffAttendanceDto.staffCode !== undefined
            ? updateStaffAttendanceDto.staffCode.trim()
            : undefined,

        staffName:
          updateStaffAttendanceDto.staffName !== undefined
            ? updateStaffAttendanceDto.staffName.trim()
            : undefined,

        department:
          updateStaffAttendanceDto.department !== undefined
            ? this.emptyToNull(updateStaffAttendanceDto.department)
            : undefined,

        designation:
          updateStaffAttendanceDto.designation !== undefined
            ? this.emptyToNull(updateStaffAttendanceDto.designation)
            : undefined,

        attendanceDate:
          updateStaffAttendanceDto.attendanceDate !== undefined
            ? nextAttendanceDate
            : undefined,

        status: updateStaffAttendanceDto.status as
          | StaffAttendanceStatus
          | undefined,

        remarks:
          updateStaffAttendanceDto.remarks !== undefined
            ? this.emptyToNull(updateStaffAttendanceDto.remarks)
            : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.staffAttendance.delete({
      where: { id },
    });

    return {
      message: 'Staff attendance record deleted successfully',
    };
  }

  private async validateDuplicateAttendance(
    staffCode: string,
    attendanceDate: Date,
    ignoreAttendanceId?: string,
  ) {
    const dateRange = this.getDateRange(attendanceDate.toISOString());

    const existingAttendance = await this.prisma.staffAttendance.findFirst({
      where: {
        staffCode: staffCode.trim(),
        attendanceDate: {
          gte: dateRange.start,
          lt: dateRange.end,
        },
        id: ignoreAttendanceId
          ? {
              not: ignoreAttendanceId,
            }
          : undefined,
      },
    });

    if (existingAttendance) {
      throw new BadRequestException(
        'Attendance is already marked for this staff member on this date',
      );
    }
  }

  private parseDate(value: string): Date {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid attendance date');
    }

    return date;
  }

  private getDateRange(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date filter');
    }

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return {
      start,
      end,
    };
  }

  private emptyToNull(value?: string | null): string | null {
    const cleanedValue = value?.trim();

    return cleanedValue ? cleanedValue : null;
  }
}
