import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class HolidaysService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.holiday.findMany({
      where: search
        ? {
            OR: [
              { holidayCode: { contains: search, mode: 'insensitive' } },
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: {
        startDate: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const holiday = await this.prisma.holiday.findUnique({
      where: { id },
    });

    if (!holiday) {
      throw new NotFoundException('Holiday not found');
    }

    return holiday;
  }

  async generateNextCode() {
    const holidays = await this.prisma.holiday.findMany({
      select: {
        holidayCode: true,
      },
    });

    const highestNumber = holidays.reduce((highest, holiday) => {
      const match = holiday.holidayCode.match(/\d+/);
      const codeNumber = match ? Number(match[0]) : 0;

      return codeNumber > highest ? codeNumber : highest;
    }, 0);

    return {
      holidayCode: `HLD-${String(highestNumber + 1).padStart(4, '0')}`,
    };
  }

  async create(createHolidayDto: CreateHolidayDto) {
    await this.validateUniqueHolidayCode(createHolidayDto.holidayCode);

    this.validateDateRange(
      createHolidayDto.startDate,
      createHolidayDto.endDate,
    );

    return this.prisma.holiday.create({
      data: {
        holidayCode: createHolidayDto.holidayCode.trim(),
        title: createHolidayDto.title.trim(),
        startDate: new Date(createHolidayDto.startDate),
        endDate: new Date(createHolidayDto.endDate),
        holidayType: createHolidayDto.holidayType || 'PUBLIC',
        description: createHolidayDto.description?.trim() || null,
        status: createHolidayDto.status || 'ACTIVE',
      },
    });
  }

  async update(id: string, updateHolidayDto: UpdateHolidayDto) {
    const existingHoliday = await this.findOne(id);

    if (updateHolidayDto.holidayCode) {
      await this.validateUniqueHolidayCode(updateHolidayDto.holidayCode, id);
    }

    const nextStartDate =
      updateHolidayDto.startDate || existingHoliday.startDate.toISOString();

    const nextEndDate =
      updateHolidayDto.endDate || existingHoliday.endDate.toISOString();

    this.validateDateRange(nextStartDate, nextEndDate);

    return this.prisma.holiday.update({
      where: { id },
      data: {
        holidayCode: updateHolidayDto.holidayCode?.trim(),
        title: updateHolidayDto.title?.trim(),
        startDate:
          updateHolidayDto.startDate !== undefined
            ? new Date(updateHolidayDto.startDate)
            : undefined,
        endDate:
          updateHolidayDto.endDate !== undefined
            ? new Date(updateHolidayDto.endDate)
            : undefined,
        holidayType: updateHolidayDto.holidayType,
        description:
          updateHolidayDto.description !== undefined
            ? updateHolidayDto.description?.trim() || null
            : undefined,
        status: updateHolidayDto.status,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.holiday.delete({
      where: { id },
    });

    return {
      message: 'Holiday deleted successfully',
    };
  }

  private validateDateRange(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      throw new BadRequestException('End date cannot be before start date');
    }
  }

  private async validateUniqueHolidayCode(
    holidayCode: string,
    ignoreHolidayId?: string,
  ) {
    const existingHoliday = await this.prisma.holiday.findUnique({
      where: {
        holidayCode: holidayCode.trim(),
      },
    });

    if (existingHoliday && existingHoliday.id !== ignoreHolidayId) {
      throw new BadRequestException('Holiday ID already exists');
    }
  }
}
