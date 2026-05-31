import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.subject.findMany({
      where: search
        ? {
            OR: [
              { subjectCode: { contains: search, mode: 'insensitive' } },
              { subjectName: { contains: search, mode: 'insensitive' } },
              { className: { contains: search, mode: 'insensitive' } },
              { teacherName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    return subject;
  }

  async create(createSubjectDto: CreateSubjectDto) {
    await this.validateUniqueSubjectCode(createSubjectDto.subjectCode);

    return this.prisma.subject.create({
      data: {
        subjectCode: createSubjectDto.subjectCode.trim(),
        subjectName: createSubjectDto.subjectName.trim(),
        className: createSubjectDto.className?.trim() || null,
        teacherName: createSubjectDto.teacherName?.trim() || null,
        weeklyHours: createSubjectDto.weeklyHours ?? null,
        status: createSubjectDto.status || 'ACTIVE',
      },
    });
  }

  async update(id: string, updateSubjectDto: UpdateSubjectDto) {
    await this.findOne(id);

    if (updateSubjectDto.subjectCode) {
      await this.validateUniqueSubjectCode(updateSubjectDto.subjectCode, id);
    }

    return this.prisma.subject.update({
      where: { id },
      data: {
        subjectCode: updateSubjectDto.subjectCode?.trim(),
        subjectName: updateSubjectDto.subjectName?.trim(),
        className: updateSubjectDto.className?.trim(),
        teacherName: updateSubjectDto.teacherName?.trim(),
        weeklyHours: updateSubjectDto.weeklyHours,
        status: updateSubjectDto.status,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.subject.delete({
      where: { id },
    });

    return {
      message: 'Subject deleted successfully',
    };
  }

  private async validateUniqueSubjectCode(
    subjectCode: string,
    ignoreSubjectId?: string,
  ) {
    const existingSubject = await this.prisma.subject.findUnique({
      where: {
        subjectCode: subjectCode.trim(),
      },
    });

    if (existingSubject && existingSubject.id !== ignoreSubjectId) {
      throw new BadRequestException('Subject code already exists');
    }
  }
}
