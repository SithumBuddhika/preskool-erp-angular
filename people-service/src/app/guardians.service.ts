import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class GuardiansService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.guardian.findMany({
      where: search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { occupation: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const guardian = await this.prisma.guardian.findUnique({
      where: { id },
    });

    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }

    return guardian;
  }

  async create(createGuardianDto: CreateGuardianDto) {
    if (createGuardianDto.email) {
      await this.validateUniqueEmail(createGuardianDto.email);
    }

    return this.prisma.guardian.create({
      data: {
        fullName: createGuardianDto.fullName.trim(),
        email: createGuardianDto.email?.toLowerCase().trim() || null,
        phone: createGuardianDto.phone.trim(),
        relation: createGuardianDto.relation,
        occupation: createGuardianDto.occupation?.trim() || null,
        address: createGuardianDto.address?.trim() || null,
        status: createGuardianDto.status || 'ACTIVE',
      },
    });
  }

  async update(id: string, updateGuardianDto: UpdateGuardianDto) {
    await this.findOne(id);

    if (updateGuardianDto.email) {
      await this.validateUniqueEmail(updateGuardianDto.email, id);
    }

    return this.prisma.guardian.update({
      where: { id },
      data: {
        fullName: updateGuardianDto.fullName?.trim(),
        email: updateGuardianDto.email?.toLowerCase().trim(),
        phone: updateGuardianDto.phone?.trim(),
        relation: updateGuardianDto.relation,
        occupation: updateGuardianDto.occupation?.trim(),
        address: updateGuardianDto.address?.trim(),
        status: updateGuardianDto.status,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.guardian.delete({
      where: { id },
    });

    return {
      message: 'Guardian deleted successfully',
    };
  }

  private async validateUniqueEmail(email: string, ignoreGuardianId?: string) {
    const existingGuardian = await this.prisma.guardian.findUnique({
      where: {
        email: email.toLowerCase().trim(),
      },
    });

    if (existingGuardian && existingGuardian.id !== ignoreGuardianId) {
      throw new BadRequestException('Email already exists');
    }
  }
}
