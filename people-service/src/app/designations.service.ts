import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDesignationDto } from './dto/create-designation.dto';
import { UpdateDesignationDto } from './dto/update-designation.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class DesignationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.designation.findMany({
      where: search
        ? {
            OR: [
              { designationCode: { contains: search, mode: 'insensitive' } },
              { designationName: { contains: search, mode: 'insensitive' } },
              { departmentCode: { contains: search, mode: 'insensitive' } },
              { departmentName: { contains: search, mode: 'insensitive' } },
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
    const designation = await this.prisma.designation.findUnique({
      where: { id },
    });

    if (!designation) {
      throw new NotFoundException('Designation not found');
    }

    return designation;
  }

  async generateNextCode() {
    const designations = await this.prisma.designation.findMany({
      select: {
        designationCode: true,
      },
    });

    const highestNumber = designations.reduce((highest, designation) => {
      const match = designation.designationCode.match(/\d+/);
      const codeNumber = match ? Number(match[0]) : 0;

      return codeNumber > highest ? codeNumber : highest;
    }, 0);

    return {
      designationCode: `DES-${String(highestNumber + 1).padStart(4, '0')}`,
    };
  }

  async create(createDesignationDto: CreateDesignationDto) {
    await this.validateUniqueDesignationCode(
      createDesignationDto.designationCode,
    );

    return this.prisma.designation.create({
      data: {
        designationCode: createDesignationDto.designationCode.trim(),
        designationName: createDesignationDto.designationName.trim(),
        departmentCode: createDesignationDto.departmentCode?.trim() || null,
        departmentName: createDesignationDto.departmentName?.trim() || null,
        description: createDesignationDto.description?.trim() || null,
        status: createDesignationDto.status || 'ACTIVE',
      },
    });
  }

  async update(id: string, updateDesignationDto: UpdateDesignationDto) {
    await this.findOne(id);

    if (updateDesignationDto.designationCode) {
      await this.validateUniqueDesignationCode(
        updateDesignationDto.designationCode,
        id,
      );
    }

    return this.prisma.designation.update({
      where: { id },
      data: {
        designationCode: updateDesignationDto.designationCode?.trim(),
        designationName: updateDesignationDto.designationName?.trim(),
        departmentCode:
          updateDesignationDto.departmentCode !== undefined
            ? updateDesignationDto.departmentCode?.trim() || null
            : undefined,
        departmentName:
          updateDesignationDto.departmentName !== undefined
            ? updateDesignationDto.departmentName?.trim() || null
            : undefined,
        description:
          updateDesignationDto.description !== undefined
            ? updateDesignationDto.description?.trim() || null
            : undefined,
        status: updateDesignationDto.status,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.designation.delete({
      where: { id },
    });

    return {
      message: 'Designation deleted successfully',
    };
  }

  private async validateUniqueDesignationCode(
    designationCode: string,
    ignoreDesignationId?: string,
  ) {
    const existingDesignation = await this.prisma.designation.findUnique({
      where: {
        designationCode: designationCode.trim(),
      },
    });

    if (existingDesignation && existingDesignation.id !== ignoreDesignationId) {
      throw new BadRequestException('Designation ID already exists');
    }
  }
}
