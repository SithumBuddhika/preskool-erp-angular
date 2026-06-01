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
    const keyword = search?.trim();

    return this.prisma.subject.findMany({
      where: keyword
        ? {
            OR: [
              { subjectCode: { contains: keyword, mode: 'insensitive' } },
              { subjectName: { contains: keyword, mode: 'insensitive' } },
              { className: { contains: keyword, mode: 'insensitive' } },
              { teacherName: { contains: keyword, mode: 'insensitive' } },
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
        className: this.emptyToNull(createSubjectDto.className),
        teacherName: this.emptyToNull(createSubjectDto.teacherName),
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
        className:
          updateSubjectDto.className !== undefined
            ? this.emptyToNull(updateSubjectDto.className)
            : undefined,
        teacherName:
          updateSubjectDto.teacherName !== undefined
            ? this.emptyToNull(updateSubjectDto.teacherName)
            : undefined,
        weeklyHours:
          updateSubjectDto.weeklyHours !== undefined
            ? updateSubjectDto.weeklyHours
            : undefined,
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

  private emptyToNull(value?: string | null): string | null {
    const cleanedValue = value?.trim();

    return cleanedValue ? cleanedValue : null;
  }
}
