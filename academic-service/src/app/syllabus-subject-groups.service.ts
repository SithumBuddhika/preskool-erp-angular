import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSyllabusSubjectGroupDto } from './dto/create-syllabus-subject-group.dto';
import { UpdateSyllabusSubjectGroupDto } from './dto/update-syllabus-subject-group.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class SyllabusSubjectGroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.syllabusSubjectGroup.findMany({
      where: search
        ? {
            OR: [
              { groupCode: { contains: search, mode: 'insensitive' } },
              { groupName: { contains: search, mode: 'insensitive' } },
              { className: { contains: search, mode: 'insensitive' } },
              { section: { contains: search, mode: 'insensitive' } },
              { classTeacher: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const group = await this.prisma.syllabusSubjectGroup.findUnique({
      where: { id },
    });

    if (!group) {
      throw new NotFoundException('Syllabus subject group not found');
    }

    return group;
  }

  async generateNextCode() {
    const groups = await this.prisma.syllabusSubjectGroup.findMany({
      select: {
        groupCode: true,
      },
    });

    const highestNumber = groups.reduce((highest, group) => {
      const match = group.groupCode.match(/\d+/);
      const codeNumber = match ? Number(match[0]) : 0;

      return codeNumber > highest ? codeNumber : highest;
    }, 0);

    return {
      groupCode: `SSG-${String(highestNumber + 1).padStart(4, '0')}`,
    };
  }

  async create(createDto: CreateSyllabusSubjectGroupDto) {
    await this.validateUniqueGroupCode(createDto.groupCode);
    this.validateSubjects(createDto.subjectNames);

    const subjectNames = this.cleanStringArray(createDto.subjectNames);
    const subjectCodes = this.cleanStringArray(createDto.subjectCodes || []);

    return this.prisma.syllabusSubjectGroup.create({
      data: {
        groupCode: createDto.groupCode.trim(),
        groupName: createDto.groupName.trim(),
        className: createDto.className.trim(),
        section: createDto.section.trim(),
        classTeacher: createDto.classTeacher?.trim() || null,
        subjectNames,
        subjectCodes,
        totalSubjects: subjectNames.length,
        status: createDto.status || 'ACTIVE',
      },
    });
  }

  async update(id: string, updateDto: UpdateSyllabusSubjectGroupDto) {
    const existingGroup = await this.findOne(id);

    if (updateDto.groupCode) {
      await this.validateUniqueGroupCode(updateDto.groupCode, id);
    }

    const nextSubjectNames =
      updateDto.subjectNames !== undefined
        ? this.cleanStringArray(updateDto.subjectNames)
        : existingGroup.subjectNames;

    this.validateSubjects(nextSubjectNames);

    const nextSubjectCodes =
      updateDto.subjectCodes !== undefined
        ? this.cleanStringArray(updateDto.subjectCodes)
        : existingGroup.subjectCodes;

    return this.prisma.syllabusSubjectGroup.update({
      where: { id },
      data: {
        groupCode: updateDto.groupCode?.trim(),
        groupName: updateDto.groupName?.trim(),
        className: updateDto.className?.trim(),
        section: updateDto.section?.trim(),
        classTeacher:
          updateDto.classTeacher !== undefined
            ? updateDto.classTeacher.trim() || null
            : undefined,
        subjectNames: nextSubjectNames,
        subjectCodes: nextSubjectCodes,
        totalSubjects: nextSubjectNames.length,
        status: updateDto.status,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.syllabusSubjectGroup.delete({
      where: { id },
    });

    return { message: 'Syllabus subject group deleted successfully' };
  }

  private async validateUniqueGroupCode(
    groupCode: string,
    ignoreGroupId?: string,
  ) {
    const existingGroup = await this.prisma.syllabusSubjectGroup.findUnique({
      where: {
        groupCode: groupCode.trim(),
      },
    });

    if (existingGroup && existingGroup.id !== ignoreGroupId) {
      throw new BadRequestException('Group ID already exists');
    }
  }

  private validateSubjects(subjectNames: string[]) {
    const cleanedSubjects = this.cleanStringArray(subjectNames);

    if (cleanedSubjects.length === 0) {
      throw new BadRequestException('At least one subject is required');
    }
  }

  private cleanStringArray(values: string[]) {
    return values
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  }
}
