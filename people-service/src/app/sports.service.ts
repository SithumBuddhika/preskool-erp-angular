import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSportDto } from './dto/create-sport.dto';
import { UpdateSportDto } from './dto/update-sport.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class SportsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    const keyword = search?.trim();

    return this.prisma.sport.findMany({
      where: keyword
        ? {
            OR: [
              { sportCode: { contains: keyword, mode: 'insensitive' } },
              { sportName: { contains: keyword, mode: 'insensitive' } },
              { category: { contains: keyword, mode: 'insensitive' } },
              { coachName: { contains: keyword, mode: 'insensitive' } },
              { venue: { contains: keyword, mode: 'insensitive' } },
              { practiceDays: { contains: keyword, mode: 'insensitive' } },
              { practiceTime: { contains: keyword, mode: 'insensitive' } },
              { notes: { contains: keyword, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const sport = await this.prisma.sport.findUnique({
      where: { id },
    });

    if (!sport) {
      throw new NotFoundException('Sport not found');
    }

    return sport;
  }

  async generateNextCode() {
    const sports = await this.prisma.sport.findMany({
      select: {
        sportCode: true,
      },
    });

    const highestNumber = sports.reduce((highest, sport) => {
      const match = sport.sportCode.match(/^SPT-(\d+)$/);
      const codeNumber = match ? Number(match[1]) : 0;

      return codeNumber > highest ? codeNumber : highest;
    }, 0);

    return {
      sportCode: `SPT-${String(highestNumber + 1).padStart(4, '0')}`,
    };
  }

  async create(createSportDto: CreateSportDto) {
    const sportCode = createSportDto.sportCode.trim();

    await this.validateUniqueSportCode(sportCode);

    const maxParticipants = createSportDto.maxParticipants ?? 0;
    const currentParticipants = createSportDto.currentParticipants ?? 0;

    this.validateParticipants(maxParticipants, currentParticipants);

    return this.prisma.sport.create({
      data: {
        sportCode,
        sportName: createSportDto.sportName.trim(),
        category: this.emptyToNull(createSportDto.category),
        coachName: this.emptyToNull(createSportDto.coachName),
        venue: this.emptyToNull(createSportDto.venue),
        practiceDays: this.emptyToNull(createSportDto.practiceDays),
        practiceTime: this.emptyToNull(createSportDto.practiceTime),
        maxParticipants,
        currentParticipants,
        status: createSportDto.status || 'ACTIVE',
        notes: this.emptyToNull(createSportDto.notes),
      },
    });
  }

  async update(id: string, updateSportDto: UpdateSportDto) {
    const existingSport = await this.findOne(id);

    if (updateSportDto.sportCode !== undefined) {
      await this.validateUniqueSportCode(updateSportDto.sportCode, id);
    }

    const nextMaxParticipants =
      updateSportDto.maxParticipants ?? existingSport.maxParticipants;

    const nextCurrentParticipants =
      updateSportDto.currentParticipants ?? existingSport.currentParticipants;

    this.validateParticipants(nextMaxParticipants, nextCurrentParticipants);

    return this.prisma.sport.update({
      where: { id },
      data: {
        sportCode:
          updateSportDto.sportCode !== undefined
            ? updateSportDto.sportCode.trim()
            : undefined,

        sportName:
          updateSportDto.sportName !== undefined
            ? updateSportDto.sportName.trim()
            : undefined,

        category:
          updateSportDto.category !== undefined
            ? this.emptyToNull(updateSportDto.category)
            : undefined,

        coachName:
          updateSportDto.coachName !== undefined
            ? this.emptyToNull(updateSportDto.coachName)
            : undefined,

        venue:
          updateSportDto.venue !== undefined
            ? this.emptyToNull(updateSportDto.venue)
            : undefined,

        practiceDays:
          updateSportDto.practiceDays !== undefined
            ? this.emptyToNull(updateSportDto.practiceDays)
            : undefined,

        practiceTime:
          updateSportDto.practiceTime !== undefined
            ? this.emptyToNull(updateSportDto.practiceTime)
            : undefined,

        maxParticipants: updateSportDto.maxParticipants,
        currentParticipants: updateSportDto.currentParticipants,
        status: updateSportDto.status,

        notes:
          updateSportDto.notes !== undefined
            ? this.emptyToNull(updateSportDto.notes)
            : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.sport.delete({
      where: { id },
    });

    return {
      message: 'Sport deleted successfully',
    };
  }

  private async validateUniqueSportCode(
    sportCode: string,
    ignoreSportId?: string,
  ) {
    const existingSport = await this.prisma.sport.findUnique({
      where: {
        sportCode: sportCode.trim(),
      },
    });

    if (existingSport && existingSport.id !== ignoreSportId) {
      throw new BadRequestException('Sport code already exists');
    }
  }

  private validateParticipants(
    maxParticipants: number,
    currentParticipants: number,
  ) {
    if (maxParticipants > 0 && currentParticipants > maxParticipants) {
      throw new BadRequestException(
        'Current participants cannot be greater than max participants',
      );
    }
  }

  private emptyToNull(value?: string | null): string | null {
    const cleanedValue = value?.trim();

    return cleanedValue ? cleanedValue : null;
  }
}
