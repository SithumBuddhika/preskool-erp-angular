import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.grade.findMany({
      where: search
        ? {
            OR: [
              { gradeCode: { contains: search, mode: 'insensitive' } },
              { examCode: { contains: search, mode: 'insensitive' } },
              { examName: { contains: search, mode: 'insensitive' } },
              { className: { contains: search, mode: 'insensitive' } },
              { section: { contains: search, mode: 'insensitive' } },
              { subjectName: { contains: search, mode: 'insensitive' } },
              { teacherName: { contains: search, mode: 'insensitive' } },
              { admissionNo: { contains: search, mode: 'insensitive' } },
              { studentName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const grade = await this.prisma.grade.findUnique({
      where: { id },
    });

    if (!grade) {
      throw new NotFoundException('Grade record not found');
    }

    return grade;
  }

  async generateNextCode() {
    const grades = await this.prisma.grade.findMany({
      select: {
        gradeCode: true,
      },
    });

    const highestNumber = grades.reduce((highest, grade) => {
      const match = grade.gradeCode.match(/\d+/);
      const codeNumber = match ? Number(match[0]) : 0;

      return codeNumber > highest ? codeNumber : highest;
    }, 0);

    return {
      gradeCode: `GRD-${String(highestNumber + 1).padStart(4, '0')}`,
    };
  }

  async create(createGradeDto: CreateGradeDto) {
    await this.validateUniqueGradeCode(createGradeDto.gradeCode);
    await this.validateUniqueExamStudent(
      createGradeDto.examCode,
      createGradeDto.admissionNo,
    );

    this.validateMarks(
      createGradeDto.marksObtained,
      createGradeDto.maxMarks,
      createGradeDto.minMarks,
    );

    const result = this.calculateResult(
      createGradeDto.marksObtained,
      createGradeDto.minMarks,
    );

    const gradeLetter = this.calculateGradeLetter(
      createGradeDto.marksObtained,
      createGradeDto.maxMarks,
    );

    return this.prisma.grade.create({
      data: {
        gradeCode: createGradeDto.gradeCode.trim(),
        examCode: createGradeDto.examCode.trim(),
        examName: createGradeDto.examName.trim(),
        className: createGradeDto.className.trim(),
        section: createGradeDto.section.trim(),
        subjectName: createGradeDto.subjectName.trim(),
        teacherName: createGradeDto.teacherName.trim(),
        admissionNo: createGradeDto.admissionNo.trim(),
        studentName: createGradeDto.studentName.trim(),
        marksObtained: Number(createGradeDto.marksObtained),
        maxMarks: Number(createGradeDto.maxMarks),
        minMarks: Number(createGradeDto.minMarks),
        result,
        gradeLetter,
        status: createGradeDto.status || 'DRAFT',
      },
    });
  }

  async update(id: string, updateGradeDto: UpdateGradeDto) {
    const existingGrade = await this.findOne(id);

    if (updateGradeDto.gradeCode) {
      await this.validateUniqueGradeCode(updateGradeDto.gradeCode, id);
    }

    const nextExamCode = updateGradeDto.examCode || existingGrade.examCode;
    const nextAdmissionNo =
      updateGradeDto.admissionNo || existingGrade.admissionNo;

    if (
      nextExamCode !== existingGrade.examCode ||
      nextAdmissionNo !== existingGrade.admissionNo
    ) {
      await this.validateUniqueExamStudent(nextExamCode, nextAdmissionNo, id);
    }

    const nextMarksObtained =
      updateGradeDto.marksObtained ?? existingGrade.marksObtained;
    const nextMaxMarks = updateGradeDto.maxMarks ?? existingGrade.maxMarks;
    const nextMinMarks = updateGradeDto.minMarks ?? existingGrade.minMarks;

    this.validateMarks(nextMarksObtained, nextMaxMarks, nextMinMarks);

    const result = this.calculateResult(nextMarksObtained, nextMinMarks);
    const gradeLetter = this.calculateGradeLetter(
      nextMarksObtained,
      nextMaxMarks,
    );

    return this.prisma.grade.update({
      where: { id },
      data: {
        gradeCode: updateGradeDto.gradeCode?.trim(),
        examCode: updateGradeDto.examCode?.trim(),
        examName: updateGradeDto.examName?.trim(),
        className: updateGradeDto.className?.trim(),
        section: updateGradeDto.section?.trim(),
        subjectName: updateGradeDto.subjectName?.trim(),
        teacherName: updateGradeDto.teacherName?.trim(),
        admissionNo: updateGradeDto.admissionNo?.trim(),
        studentName: updateGradeDto.studentName?.trim(),
        marksObtained: updateGradeDto.marksObtained,
        maxMarks: updateGradeDto.maxMarks,
        minMarks: updateGradeDto.minMarks,
        result,
        gradeLetter,
        status: updateGradeDto.status,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.grade.delete({
      where: { id },
    });

    return { message: 'Grade record deleted successfully' };
  }

  private async validateUniqueGradeCode(
    gradeCode: string,
    ignoreGradeId?: string,
  ) {
    const existingGrade = await this.prisma.grade.findUnique({
      where: {
        gradeCode: gradeCode.trim(),
      },
    });

    if (existingGrade && existingGrade.id !== ignoreGradeId) {
      throw new BadRequestException('Grade ID already exists');
    }
  }

  private async validateUniqueExamStudent(
    examCode: string,
    admissionNo: string,
    ignoreGradeId?: string,
  ) {
    const existingGrade = await this.prisma.grade.findUnique({
      where: {
        examCode_admissionNo: {
          examCode: examCode.trim(),
          admissionNo: admissionNo.trim(),
        },
      },
    });

    if (existingGrade && existingGrade.id !== ignoreGradeId) {
      throw new BadRequestException(
        'This student already has marks for this exam',
      );
    }
  }

  private validateMarks(
    marksObtained: number,
    maxMarks: number,
    minMarks: number,
  ) {
    if (minMarks > maxMarks) {
      throw new BadRequestException(
        'Minimum marks cannot exceed maximum marks',
      );
    }

    if (marksObtained > maxMarks) {
      throw new BadRequestException(
        'Marks obtained cannot exceed maximum marks',
      );
    }
  }

  private calculateResult(marksObtained: number, minMarks: number) {
    return marksObtained >= minMarks ? 'PASS' : 'FAIL';
  }

  private calculateGradeLetter(marksObtained: number, maxMarks: number) {
    const percentage = (marksObtained / maxMarks) * 100;

    if (percentage >= 75) {
      return 'A';
    }

    if (percentage >= 65) {
      return 'B';
    }

    if (percentage >= 55) {
      return 'C';
    }

    if (percentage >= 40) {
      return 'S';
    }

    return 'F';
  }
}
