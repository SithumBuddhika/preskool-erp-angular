import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.schoolClass.findMany({
      where: search
        ? {
            OR: [
              { className: { contains: search, mode: 'insensitive' } },
              { section: { contains: search, mode: 'insensitive' } },
              { classTeacher: { contains: search, mode: 'insensitive' } },
              { roomNo: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: { id },
    });

    if (!schoolClass) {
      throw new NotFoundException('Class not found');
    }

    return schoolClass;
  }

  async create(createClassDto: CreateClassDto) {
    await this.validateUniqueClassSection(
      createClassDto.className,
      createClassDto.section,
    );

    return this.prisma.schoolClass.create({
      data: {
        className: createClassDto.className.trim(),
        section: createClassDto.section.trim(),
        classTeacher: createClassDto.classTeacher?.trim() || null,
        roomNo: createClassDto.roomNo?.trim() || null,
        capacity: createClassDto.capacity ?? null,
        status: createClassDto.status || 'ACTIVE',
      },
    });
  }

  async update(id: string, updateClassDto: UpdateClassDto) {
    const existingClass = await this.findOne(id);

    const nextClassName = updateClassDto.className || existingClass.className;
    const nextSection = updateClassDto.section || existingClass.section;

    if (
      updateClassDto.className !== undefined ||
      updateClassDto.section !== undefined
    ) {
      await this.validateUniqueClassSection(nextClassName, nextSection, id);
    }

    return this.prisma.schoolClass.update({
      where: { id },
      data: {
        className: updateClassDto.className?.trim(),
        section: updateClassDto.section?.trim(),
        classTeacher: updateClassDto.classTeacher?.trim(),
        roomNo: updateClassDto.roomNo?.trim(),
        capacity: updateClassDto.capacity,
        status: updateClassDto.status,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.schoolClass.delete({
      where: { id },
    });

    return {
      message: 'Class deleted successfully',
    };
  }

  private async validateUniqueClassSection(
    className: string,
    section: string,
    ignoreClassId?: string,
  ) {
    const existingClass = await this.prisma.schoolClass.findFirst({
      where: {
        className: className.trim(),
        section: section.trim(),
      },
    });

    if (existingClass && existingClass.id !== ignoreClassId) {
      throw new BadRequestException('Class and section already exists');
    }
  }
}
