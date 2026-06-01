import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateFeeGroupDto } from './dto/create-fee-group.dto';
import { UpdateFeeGroupDto } from './dto/update-fee-group.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class FeeGroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.feeGroup.findMany({
      where: search
        ? {
            OR: [
              { feeGroupCode: { contains: search, mode: 'insensitive' } },
              { feeGroupName: { contains: search, mode: 'insensitive' } },
              { className: { contains: search, mode: 'insensitive' } },
              { section: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const feeGroup = await this.prisma.feeGroup.findUnique({
      where: { id },
    });

    if (!feeGroup) {
      throw new NotFoundException('Fee group not found');
    }

    return feeGroup;
  }

  async generateNextCode() {
    const feeGroups = await this.prisma.feeGroup.findMany({
      select: {
        feeGroupCode: true,
      },
    });

    const highestNumber = feeGroups.reduce((highest, feeGroup) => {
      const match = feeGroup.feeGroupCode.match(/\d+/);
      const codeNumber = match ? Number(match[0]) : 0;

      return codeNumber > highest ? codeNumber : highest;
    }, 0);

    return {
      feeGroupCode: `FGP-${String(highestNumber + 1).padStart(4, '0')}`,
    };
  }

  async create(createFeeGroupDto: CreateFeeGroupDto) {
    await this.validateUniqueFeeGroupCode(createFeeGroupDto.feeGroupCode);

    return this.prisma.feeGroup.create({
      data: {
        feeGroupCode: createFeeGroupDto.feeGroupCode.trim(),
        feeGroupName: createFeeGroupDto.feeGroupName.trim(),
        className: createFeeGroupDto.className?.trim() || null,
        section: createFeeGroupDto.section?.trim() || null,
        feeType: createFeeGroupDto.feeType,
        amount: createFeeGroupDto.amount,
        dueDays: createFeeGroupDto.dueDays ?? null,
        description: createFeeGroupDto.description?.trim() || null,
        status: createFeeGroupDto.status || 'ACTIVE',
      },
    });
  }

  async update(id: string, updateFeeGroupDto: UpdateFeeGroupDto) {
    await this.findOne(id);

    if (updateFeeGroupDto.feeGroupCode) {
      await this.validateUniqueFeeGroupCode(updateFeeGroupDto.feeGroupCode, id);
    }

    return this.prisma.feeGroup.update({
      where: { id },
      data: {
        feeGroupCode: updateFeeGroupDto.feeGroupCode?.trim(),
        feeGroupName: updateFeeGroupDto.feeGroupName?.trim(),
        className:
          updateFeeGroupDto.className !== undefined
            ? updateFeeGroupDto.className?.trim() || null
            : undefined,
        section:
          updateFeeGroupDto.section !== undefined
            ? updateFeeGroupDto.section?.trim() || null
            : undefined,
        feeType: updateFeeGroupDto.feeType,
        amount: updateFeeGroupDto.amount,
        dueDays:
          updateFeeGroupDto.dueDays !== undefined
            ? updateFeeGroupDto.dueDays
            : undefined,
        description:
          updateFeeGroupDto.description !== undefined
            ? updateFeeGroupDto.description?.trim() || null
            : undefined,
        status: updateFeeGroupDto.status,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.feeGroup.delete({
      where: { id },
    });

    return {
      message: 'Fee group deleted successfully',
    };
  }

  private async validateUniqueFeeGroupCode(
    feeGroupCode: string,
    ignoreFeeGroupId?: string,
  ) {
    const existingFeeGroup = await this.prisma.feeGroup.findUnique({
      where: {
        feeGroupCode: feeGroupCode.trim(),
      },
    });

    if (existingFeeGroup && existingFeeGroup.id !== ignoreFeeGroupId) {
      throw new BadRequestException('Fee Group ID already exists');
    }
  }
}
