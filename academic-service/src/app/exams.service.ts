import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.exam.findMany({
      where: search
        ? {
            OR: [
              { examCode: { contains: search, mode: 'insensitive' } },
              { examName: { contains: search, mode: 'insensitive' } },
              { className: { contains: search, mode: 'insensitive' } },
              { section: { contains: search, mode: 'insensitive' } },
              { subjectName: { contains: search, mode: 'insensitive' } },
              { teacherName: { contains: search, mode: 'insensitive' } },
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
    const exam = await this.prisma.exam.findUnique({
      where: { id },
    });

    if (!exam) {
      throw new NotFoundException('Exam schedule not found');
    }

    return exam;
  }

  async generateNextCode() {
    const exams = await this.prisma.exam.findMany({
      select: {
        examCode: true,
      },
    });

    const highestNumber = exams.reduce((highest, exam) => {
      const match = exam.examCode.match(/\d+/);
      const codeNumber = match ? Number(match[0]) : 0;

      return codeNumber > highest ? codeNumber : highest;
    }, 0);

    return {
      examCode: `EXM-${String(highestNumber + 1).padStart(4, '0')}`,
    };
  }

  async create(createExamDto: CreateExamDto) {
    await this.validateUniqueExamCode(createExamDto.examCode);

    this.validateTimeRange(createExamDto.startTime, createExamDto.endTime);
    this.validateMarks(createExamDto.maxMarks, createExamDto.minMarks);

    return this.prisma.exam.create({
      data: {
        examCode: createExamDto.examCode.trim(),
        examName: createExamDto.examName.trim(),
        className: createExamDto.className.trim(),
        section: createExamDto.section.trim(),
        subjectName: createExamDto.subjectName.trim(),
        teacherName: createExamDto.teacherName.trim(),
        roomNo: createExamDto.roomNo.trim(),
        examDate: new Date(createExamDto.examDate),
        startTime: createExamDto.startTime,
        endTime: createExamDto.endTime,
        maxMarks: Number(createExamDto.maxMarks),
        minMarks: Number(createExamDto.minMarks),
        status: createExamDto.status || 'SCHEDULED',
      },
    });
  }

  async update(id: string, updateExamDto: UpdateExamDto) {
    const existingExam = await this.findOne(id);

    if (updateExamDto.examCode) {
      await this.validateUniqueExamCode(updateExamDto.examCode, id);
    }

    const nextStartTime = updateExamDto.startTime || existingExam.startTime;
    const nextEndTime = updateExamDto.endTime || existingExam.endTime;
    const nextMaxMarks = updateExamDto.maxMarks ?? existingExam.maxMarks;
    const nextMinMarks = updateExamDto.minMarks ?? existingExam.minMarks;

    this.validateTimeRange(nextStartTime, nextEndTime);
    this.validateMarks(nextMaxMarks, nextMinMarks);

    return this.prisma.exam.update({
      where: { id },
      data: {
        examCode: updateExamDto.examCode?.trim(),
        examName: updateExamDto.examName?.trim(),
        className: updateExamDto.className?.trim(),
        section: updateExamDto.section?.trim(),
        subjectName: updateExamDto.subjectName?.trim(),
        teacherName: updateExamDto.teacherName?.trim(),
        roomNo: updateExamDto.roomNo?.trim(),
        examDate: updateExamDto.examDate
          ? new Date(updateExamDto.examDate)
          : undefined,
        startTime: updateExamDto.startTime,
        endTime: updateExamDto.endTime,
        maxMarks: updateExamDto.maxMarks,
        minMarks: updateExamDto.minMarks,
        status: updateExamDto.status,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.exam.delete({
      where: { id },
    });

    return { message: 'Exam schedule deleted successfully' };
  }

  private async validateUniqueExamCode(
    examCode: string,
    ignoreExamId?: string,
  ) {
    const existingExam = await this.prisma.exam.findUnique({
      where: {
        examCode: examCode.trim(),
      },
    });

    if (existingExam && existingExam.id !== ignoreExamId) {
      throw new BadRequestException('Exam ID already exists');
    }
  }

  private validateTimeRange(startTime: string, endTime: string) {
    if (startTime >= endTime) {
      throw new BadRequestException('End time must be later than start time');
    }
  }

  private validateMarks(maxMarks: number, minMarks: number) {
    if (minMarks > maxMarks) {
      throw new BadRequestException(
        'Minimum marks cannot exceed maximum marks',
      );
    }
  }
}
