import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class ParentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.parent.findMany({
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
    const parent = await this.prisma.parent.findUnique({
      where: { id },
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    return parent;
  }

  async create(createParentDto: CreateParentDto) {
    if (createParentDto.email) {
      await this.validateUniqueEmail(createParentDto.email);
    }

    return this.prisma.parent.create({
      data: {
        fullName: createParentDto.fullName.trim(),
        email: createParentDto.email?.toLowerCase().trim() || null,
        phone: createParentDto.phone.trim(),
        relation: createParentDto.relation,
        occupation: createParentDto.occupation?.trim() || null,
        address: createParentDto.address?.trim() || null,
        status: createParentDto.status || 'ACTIVE',
      },
    });
  }

  async update(id: string, updateParentDto: UpdateParentDto) {
    await this.findOne(id);

    if (updateParentDto.email) {
      await this.validateUniqueEmail(updateParentDto.email, id);
    }

    return this.prisma.parent.update({
      where: { id },
      data: {
        fullName: updateParentDto.fullName?.trim(),
        email: updateParentDto.email?.toLowerCase().trim(),
        phone: updateParentDto.phone?.trim(),
        relation: updateParentDto.relation,
        occupation: updateParentDto.occupation?.trim(),
        address: updateParentDto.address?.trim(),
        status: updateParentDto.status,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.parent.delete({
      where: { id },
    });

    return {
      message: 'Parent deleted successfully',
    };
  }

  private async validateUniqueEmail(email: string, ignoreParentId?: string) {
    const existingParent = await this.prisma.parent.findUnique({
      where: {
        email: email.toLowerCase().trim(),
      },
    });

    if (existingParent && existingParent.id !== ignoreParentId) {
      throw new BadRequestException('Email already exists');
    }
  }
}
