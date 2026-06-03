import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  SchoolEventAudience,
  SchoolEventStatus,
  SchoolEventType,
} from '../../../generated/prisma/enums';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string, date?: string, status?: string) {
    const keyword = search?.trim();
    const dateRange = date ? this.getDateRange(date) : null;
    const cleanStatus = this.normalizeStatus(status);

    return this.prisma.schoolEvent.findMany({
      where: {
        AND: [
          keyword
            ? {
                OR: [
                  { title: { contains: keyword, mode: 'insensitive' } },
                  { location: { contains: keyword, mode: 'insensitive' } },
                  { organizer: { contains: keyword, mode: 'insensitive' } },
                  { description: { contains: keyword, mode: 'insensitive' } },
                ],
              }
            : {},
          cleanStatus
            ? {
                status: cleanStatus,
              }
            : {},
          dateRange
            ? {
                AND: [
                  {
                    startDate: {
                      lt: dateRange.end,
                    },
                  },
                  {
                    OR: [
                      {
                        endDate: {
                          gte: dateRange.start,
                        },
                      },
                      {
                        endDate: null,
                        startDate: {
                          gte: dateRange.start,
                          lt: dateRange.end,
                        },
                      },
                    ],
                  },
                ],
              }
            : {},
        ],
      },
      orderBy: [
        {
          startDate: 'asc',
        },
        {
          startTime: 'asc',
        },
      ],
    });
  }

  async findUpcoming(limit?: string) {
    const take = limit ? Number(limit) : 5;

    if (Number.isNaN(take) || take < 1) {
      throw new BadRequestException('Invalid limit');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.schoolEvent.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          {
            startDate: {
              gte: today,
            },
          },
          {
            endDate: {
              gte: today,
            },
          },
        ],
      },
      orderBy: [
        {
          startDate: 'asc',
        },
        {
          startTime: 'asc',
        },
      ],
      take,
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.schoolEvent.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async create(createEventDto: CreateEventDto) {
    const startDate = this.parseDate(createEventDto.startDate);
    const endDate = createEventDto.endDate
      ? this.parseDate(createEventDto.endDate)
      : null;

    this.validateDateOrder(startDate, endDate);

    return this.prisma.schoolEvent.create({
      data: {
        title: createEventDto.title.trim(),
        eventType: createEventDto.eventType || 'GENERAL',
        audience: createEventDto.audience || 'ALL',
        startDate,
        endDate,
        startTime: this.emptyToNull(createEventDto.startTime),
        endTime: this.emptyToNull(createEventDto.endTime),
        location: this.emptyToNull(createEventDto.location),
        organizer: this.emptyToNull(createEventDto.organizer),
        description: this.emptyToNull(createEventDto.description),
        status: createEventDto.status || 'ACTIVE',
      },
    });
  }

  async update(id: string, updateEventDto: UpdateEventDto) {
    const existingEvent = await this.findOne(id);

    const startDate = updateEventDto.startDate
      ? this.parseDate(updateEventDto.startDate)
      : existingEvent.startDate;

    const endDate =
      updateEventDto.endDate !== undefined
        ? updateEventDto.endDate
          ? this.parseDate(updateEventDto.endDate)
          : null
        : existingEvent.endDate;

    this.validateDateOrder(startDate, endDate);

    return this.prisma.schoolEvent.update({
      where: { id },
      data: {
        title:
          updateEventDto.title !== undefined
            ? updateEventDto.title.trim()
            : undefined,

        eventType: updateEventDto.eventType as SchoolEventType | undefined,

        audience: updateEventDto.audience as SchoolEventAudience | undefined,

        startDate:
          updateEventDto.startDate !== undefined ? startDate : undefined,

        endDate: updateEventDto.endDate !== undefined ? endDate : undefined,

        startTime:
          updateEventDto.startTime !== undefined
            ? this.emptyToNull(updateEventDto.startTime)
            : undefined,

        endTime:
          updateEventDto.endTime !== undefined
            ? this.emptyToNull(updateEventDto.endTime)
            : undefined,

        location:
          updateEventDto.location !== undefined
            ? this.emptyToNull(updateEventDto.location)
            : undefined,

        organizer:
          updateEventDto.organizer !== undefined
            ? this.emptyToNull(updateEventDto.organizer)
            : undefined,

        description:
          updateEventDto.description !== undefined
            ? this.emptyToNull(updateEventDto.description)
            : undefined,

        status: updateEventDto.status as SchoolEventStatus | undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.schoolEvent.delete({
      where: { id },
    });

    return {
      message: 'Event deleted successfully',
    };
  }

  private parseDate(value: string): Date {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid event date');
    }

    return date;
  }

  private validateDateOrder(startDate: Date, endDate: Date | null) {
    if (endDate && endDate < startDate) {
      throw new BadRequestException('End date cannot be before start date');
    }
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

  private normalizeStatus(status?: string): SchoolEventStatus | undefined {
    if (!status?.trim()) {
      return undefined;
    }

    const cleanStatus = status.trim().toUpperCase();

    if (cleanStatus !== 'ACTIVE' && cleanStatus !== 'INACTIVE') {
      throw new BadRequestException('Invalid event status');
    }

    return cleanStatus as SchoolEventStatus;
  }

  private emptyToNull(value?: string | null): string | null {
    const cleanedValue = value?.trim();

    return cleanedValue ? cleanedValue : null;
  }
}
