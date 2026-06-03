import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateHostelDto } from './dto/create-hostel.dto';
import { UpdateHostelDto } from './dto/update-hostel.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class HostelsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    const keyword = search?.trim();

    return this.prisma.hostel.findMany({
      where: keyword
        ? {
            OR: [
              { hostelCode: { contains: keyword, mode: 'insensitive' } },
              { hostelName: { contains: keyword, mode: 'insensitive' } },
              { wardenName: { contains: keyword, mode: 'insensitive' } },
              { phone: { contains: keyword, mode: 'insensitive' } },
              { address: { contains: keyword, mode: 'insensitive' } },
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
    const hostel = await this.prisma.hostel.findUnique({
      where: { id },
    });

    if (!hostel) {
      throw new NotFoundException('Hostel not found');
    }

    return hostel;
  }

  async generateNextCode() {
    const hostels = await this.prisma.hostel.findMany({
      select: {
        hostelCode: true,
      },
    });

    const highestNumber = hostels.reduce((highest, hostel) => {
      const match = hostel.hostelCode.match(/^HST-(\d+)$/);
      const codeNumber = match ? Number(match[1]) : 0;

      return codeNumber > highest ? codeNumber : highest;
    }, 0);

    return {
      hostelCode: `HST-${String(highestNumber + 1).padStart(4, '0')}`,
    };
  }

  async create(createHostelDto: CreateHostelDto) {
    const hostelCode = createHostelDto.hostelCode.trim();

    await this.validateUniqueHostelCode(hostelCode);

    const totalRooms = createHostelDto.totalRooms ?? 1;
    const totalBeds = createHostelDto.totalBeds ?? 1;
    const availableBeds = createHostelDto.availableBeds ?? totalBeds;

    this.validateBedCount(totalBeds, availableBeds);

    return this.prisma.hostel.create({
      data: {
        hostelCode,
        hostelName: createHostelDto.hostelName.trim(),
        hostelType: createHostelDto.hostelType,
        wardenName: this.emptyToNull(createHostelDto.wardenName),
        phone: this.emptyToNull(createHostelDto.phone),
        address: this.emptyToNull(createHostelDto.address),
        totalRooms,
        totalBeds,
        availableBeds,
        monthlyFee: createHostelDto.monthlyFee ?? null,
        status: createHostelDto.status || 'ACTIVE',
        notes: this.emptyToNull(createHostelDto.notes),
      },
    });
  }

  async update(id: string, updateHostelDto: UpdateHostelDto) {
    const existingHostel = await this.findOne(id);

    if (updateHostelDto.hostelCode !== undefined) {
      await this.validateUniqueHostelCode(updateHostelDto.hostelCode, id);
    }

    const nextTotalBeds = updateHostelDto.totalBeds ?? existingHostel.totalBeds;
    const nextAvailableBeds =
      updateHostelDto.availableBeds ?? existingHostel.availableBeds;

    this.validateBedCount(nextTotalBeds, nextAvailableBeds);

    return this.prisma.hostel.update({
      where: { id },
      data: {
        hostelCode:
          updateHostelDto.hostelCode !== undefined
            ? updateHostelDto.hostelCode.trim()
            : undefined,

        hostelName:
          updateHostelDto.hostelName !== undefined
            ? updateHostelDto.hostelName.trim()
            : undefined,

        hostelType: updateHostelDto.hostelType,

        wardenName:
          updateHostelDto.wardenName !== undefined
            ? this.emptyToNull(updateHostelDto.wardenName)
            : undefined,

        phone:
          updateHostelDto.phone !== undefined
            ? this.emptyToNull(updateHostelDto.phone)
            : undefined,

        address:
          updateHostelDto.address !== undefined
            ? this.emptyToNull(updateHostelDto.address)
            : undefined,

        totalRooms: updateHostelDto.totalRooms,
        totalBeds: updateHostelDto.totalBeds,
        availableBeds: updateHostelDto.availableBeds,
        monthlyFee: updateHostelDto.monthlyFee,
        status: updateHostelDto.status,

        notes:
          updateHostelDto.notes !== undefined
            ? this.emptyToNull(updateHostelDto.notes)
            : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.hostel.delete({
      where: { id },
    });

    return {
      message: 'Hostel deleted successfully',
    };
  }

  private async validateUniqueHostelCode(
    hostelCode: string,
    ignoreHostelId?: string,
  ) {
    const existingHostel = await this.prisma.hostel.findUnique({
      where: {
        hostelCode: hostelCode.trim(),
      },
    });

    if (existingHostel && existingHostel.id !== ignoreHostelId) {
      throw new BadRequestException('Hostel code already exists');
    }
  }

  private validateBedCount(totalBeds: number, availableBeds: number) {
    if (availableBeds > totalBeds) {
      throw new BadRequestException(
        'Available beds cannot be greater than total beds',
      );
    }
  }

  private emptyToNull(value?: string | null): string | null {
    const cleanedValue = value?.trim();

    return cleanedValue ? cleanedValue : null;
  }
}
