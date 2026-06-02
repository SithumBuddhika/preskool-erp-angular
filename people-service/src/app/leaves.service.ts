import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class LeavesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.staffLeave.findMany({
      where: search
        ? {
            OR: [
              { leaveCode: { contains: search, mode: 'insensitive' } },
              { staffCode: { contains: search, mode: 'insensitive' } },
              { staffName: { contains: search, mode: 'insensitive' } },
              { departmentCode: { contains: search, mode: 'insensitive' } },
              { departmentName: { contains: search, mode: 'insensitive' } },
              { designationCode: { contains: search, mode: 'insensitive' } },
              { designation: { contains: search, mode: 'insensitive' } },
              { reason: { contains: search, mode: 'insensitive' } },
              { approvedBy: { contains: search, mode: 'insensitive' } },
              { remarks: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const leave = await this.prisma.staffLeave.findUnique({
      where: { id },
    });

    if (!leave) {
      throw new NotFoundException('Leave record not found');
    }

    return leave;
  }

  async generateNextCode() {
    const leaves = await this.prisma.staffLeave.findMany({
      select: {
        leaveCode: true,
      },
    });

    const highestNumber = leaves.reduce((highest, leave) => {
      const match = leave.leaveCode.match(/\d+/);
      const codeNumber = match ? Number(match[0]) : 0;

      return codeNumber > highest ? codeNumber : highest;
    }, 0);

    return {
      leaveCode: `LEV-${String(highestNumber + 1).padStart(4, '0')}`,
    };
  }

  async create(createLeaveDto: CreateLeaveDto) {
    await this.validateUniqueLeaveCode(createLeaveDto.leaveCode);

    this.validateDateRange(createLeaveDto.startDate, createLeaveDto.endDate);

    const totalDays = this.calculateTotalDays(
      createLeaveDto.startDate,
      createLeaveDto.endDate,
    );

    return this.prisma.staffLeave.create({
      data: {
        leaveCode: createLeaveDto.leaveCode.trim(),
        staffCode: createLeaveDto.staffCode?.trim() || null,
        staffName: createLeaveDto.staffName.trim(),
        departmentCode: createLeaveDto.departmentCode?.trim() || null,
        departmentName: createLeaveDto.departmentName?.trim() || null,
        designationCode: createLeaveDto.designationCode?.trim() || null,
        designation: createLeaveDto.designation?.trim() || null,
        leaveType: createLeaveDto.leaveType,
        startDate: new Date(createLeaveDto.startDate),
        endDate: new Date(createLeaveDto.endDate),
        totalDays,
        reason: createLeaveDto.reason.trim(),
        status: createLeaveDto.status || 'PENDING',
        approvedBy: createLeaveDto.approvedBy?.trim() || null,
        remarks: createLeaveDto.remarks?.trim() || null,
      },
    });
  }

  async update(id: string, updateLeaveDto: UpdateLeaveDto) {
    const existingLeave = await this.findOne(id);

    if (updateLeaveDto.leaveCode) {
      await this.validateUniqueLeaveCode(updateLeaveDto.leaveCode, id);
    }

    const nextStartDate =
      updateLeaveDto.startDate || existingLeave.startDate.toISOString();

    const nextEndDate =
      updateLeaveDto.endDate || existingLeave.endDate.toISOString();

    this.validateDateRange(nextStartDate, nextEndDate);

    const nextTotalDays = this.calculateTotalDays(nextStartDate, nextEndDate);

    return this.prisma.staffLeave.update({
      where: { id },
      data: {
        leaveCode: updateLeaveDto.leaveCode?.trim(),
        staffCode:
          updateLeaveDto.staffCode !== undefined
            ? updateLeaveDto.staffCode?.trim() || null
            : undefined,
        staffName: updateLeaveDto.staffName?.trim(),
        departmentCode:
          updateLeaveDto.departmentCode !== undefined
            ? updateLeaveDto.departmentCode?.trim() || null
            : undefined,
        departmentName:
          updateLeaveDto.departmentName !== undefined
            ? updateLeaveDto.departmentName?.trim() || null
            : undefined,
        designationCode:
          updateLeaveDto.designationCode !== undefined
            ? updateLeaveDto.designationCode?.trim() || null
            : undefined,
        designation:
          updateLeaveDto.designation !== undefined
            ? updateLeaveDto.designation?.trim() || null
            : undefined,
        leaveType: updateLeaveDto.leaveType,
        startDate:
          updateLeaveDto.startDate !== undefined
            ? new Date(updateLeaveDto.startDate)
            : undefined,
        endDate:
          updateLeaveDto.endDate !== undefined
            ? new Date(updateLeaveDto.endDate)
            : undefined,
        totalDays: nextTotalDays,
        reason: updateLeaveDto.reason?.trim(),
        status: updateLeaveDto.status,
        approvedBy:
          updateLeaveDto.approvedBy !== undefined
            ? updateLeaveDto.approvedBy?.trim() || null
            : undefined,
        remarks:
          updateLeaveDto.remarks !== undefined
            ? updateLeaveDto.remarks?.trim() || null
            : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.staffLeave.delete({
      where: { id },
    });

    return {
      message: 'Leave record deleted successfully',
    };
  }

  private validateDateRange(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      throw new BadRequestException('End date cannot be before start date');
    }
  }

  private calculateTotalDays(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const difference = end.getTime() - start.getTime();
    const days = Math.floor(difference / (1000 * 60 * 60 * 24)) + 1;

    return Math.max(days, 1);
  }

  private async validateUniqueLeaveCode(
    leaveCode: string,
    ignoreLeaveId?: string,
  ) {
    const existingLeave = await this.prisma.staffLeave.findUnique({
      where: {
        leaveCode: leaveCode.trim(),
      },
    });

    if (existingLeave && existingLeave.id !== ignoreLeaveId) {
      throw new BadRequestException('Leave ID already exists');
    }
  }
}
