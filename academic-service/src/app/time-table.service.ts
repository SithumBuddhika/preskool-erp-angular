import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTimeTableDto } from './dto/create-time-table.dto';
import { UpdateTimeTableDto } from './dto/update-time-table.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class TimeTableService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.timeTable.findMany({
      where: search
        ? {
            OR: [
              { timeTableCode: { contains: search, mode: 'insensitive' } },
              { className: { contains: search, mode: 'insensitive' } },
              { section: { contains: search, mode: 'insensitive' } },
              { subjectName: { contains: search, mode: 'insensitive' } },
              { teacherName: { contains: search, mode: 'insensitive' } },
              { roomNo: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
    });
  }

  async findOne(id: string) {
    const timeTable = await this.prisma.timeTable.findUnique({
      where: { id },
    });

    if (!timeTable) {
      throw new NotFoundException('Time table record not found');
    }

    return timeTable;
  }

  async generateNextCode() {
    const records = await this.prisma.timeTable.findMany({
      select: {
        timeTableCode: true,
      },
    });

    const highestNumber = records.reduce((highest, record) => {
      const match = record.timeTableCode.match(/\d+/);
      const codeNumber = match ? Number(match[0]) : 0;

      return codeNumber > highest ? codeNumber : highest;
    }, 0);

    return {
      timeTableCode: `TTB-${String(highestNumber + 1).padStart(4, '0')}`,
    };
  }

  async create(createDto: CreateTimeTableDto) {
    await this.validateUniqueTimeTableCode(createDto.timeTableCode);
    this.validateTimeRange(createDto.startTime, createDto.endTime);

    return this.prisma.timeTable.create({
      data: {
        timeTableCode: createDto.timeTableCode.trim(),
        className: createDto.className.trim(),
        section: createDto.section.trim(),
        subjectName: createDto.subjectName.trim(),
        teacherName: createDto.teacherName.trim(),
        roomNo: createDto.roomNo.trim(),
        day: createDto.day,
        startTime: createDto.startTime,
        endTime: createDto.endTime,
        status: createDto.status || 'ACTIVE',
      },
    });
  }

  async update(id: string, updateDto: UpdateTimeTableDto) {
    const existingRecord = await this.findOne(id);

    if (updateDto.timeTableCode) {
      await this.validateUniqueTimeTableCode(updateDto.timeTableCode, id);
    }

    const nextStartTime = updateDto.startTime || existingRecord.startTime;
    const nextEndTime = updateDto.endTime || existingRecord.endTime;

    this.validateTimeRange(nextStartTime, nextEndTime);

    return this.prisma.timeTable.update({
      where: { id },
      data: {
        timeTableCode: updateDto.timeTableCode?.trim(),
        className: updateDto.className?.trim(),
        section: updateDto.section?.trim(),
        subjectName: updateDto.subjectName?.trim(),
        teacherName: updateDto.teacherName?.trim(),
        roomNo: updateDto.roomNo?.trim(),
        day: updateDto.day,
        startTime: updateDto.startTime,
        endTime: updateDto.endTime,
        status: updateDto.status,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.timeTable.delete({
      where: { id },
    });

    return { message: 'Time table record deleted successfully' };
  }

  private async validateUniqueTimeTableCode(
    timeTableCode: string,
    ignoreTimeTableId?: string,
  ) {
    const existingRecord = await this.prisma.timeTable.findUnique({
      where: {
        timeTableCode: timeTableCode.trim(),
      },
    });

    if (existingRecord && existingRecord.id !== ignoreTimeTableId) {
      throw new BadRequestException('Time Table ID already exists');
    }
  }

  private validateTimeRange(startTime: string, endTime: string) {
    if (startTime >= endTime) {
      throw new BadRequestException('End time must be later than start time');
    }
  }
}
