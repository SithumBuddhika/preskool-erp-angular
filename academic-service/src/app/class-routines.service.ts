import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateClassRoutineDto } from './dto/create-class-routine.dto';
import { UpdateClassRoutineDto } from './dto/update-class-routine.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class ClassRoutinesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.classRoutine.findMany({
      where: search
        ? {
            OR: [
              { routineCode: { contains: search, mode: 'insensitive' } },
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
    const routine = await this.prisma.classRoutine.findUnique({
      where: { id },
    });

    if (!routine) {
      throw new NotFoundException('Class routine not found');
    }

    return routine;
  }

  async generateNextCode() {
    const routines = await this.prisma.classRoutine.findMany({
      select: {
        routineCode: true,
      },
    });

    const highestNumber = routines.reduce((highest, routine) => {
      const match = routine.routineCode.match(/\d+/);
      const codeNumber = match ? Number(match[0]) : 0;

      return codeNumber > highest ? codeNumber : highest;
    }, 0);

    return {
      routineCode: `RTN-${String(highestNumber + 1).padStart(4, '0')}`,
    };
  }

  async create(createClassRoutineDto: CreateClassRoutineDto) {
    await this.validateUniqueRoutineCode(createClassRoutineDto.routineCode);

    this.validateTimeRange(
      createClassRoutineDto.startTime,
      createClassRoutineDto.endTime,
    );

    return this.prisma.classRoutine.create({
      data: {
        routineCode: createClassRoutineDto.routineCode.trim(),
        className: createClassRoutineDto.className.trim(),
        section: createClassRoutineDto.section.trim(),
        subjectName: createClassRoutineDto.subjectName.trim(),
        teacherName: createClassRoutineDto.teacherName.trim(),
        roomNo: createClassRoutineDto.roomNo.trim(),
        day: createClassRoutineDto.day,
        startTime: createClassRoutineDto.startTime,
        endTime: createClassRoutineDto.endTime,
        status: createClassRoutineDto.status || 'ACTIVE',
      },
    });
  }

  async update(id: string, updateClassRoutineDto: UpdateClassRoutineDto) {
    const existingRoutine = await this.findOne(id);

    if (updateClassRoutineDto.routineCode) {
      await this.validateUniqueRoutineCode(
        updateClassRoutineDto.routineCode,
        id,
      );
    }

    const nextStartTime =
      updateClassRoutineDto.startTime || existingRoutine.startTime;
    const nextEndTime =
      updateClassRoutineDto.endTime || existingRoutine.endTime;

    this.validateTimeRange(nextStartTime, nextEndTime);

    return this.prisma.classRoutine.update({
      where: { id },
      data: {
        routineCode: updateClassRoutineDto.routineCode?.trim(),
        className: updateClassRoutineDto.className?.trim(),
        section: updateClassRoutineDto.section?.trim(),
        subjectName: updateClassRoutineDto.subjectName?.trim(),
        teacherName: updateClassRoutineDto.teacherName?.trim(),
        roomNo: updateClassRoutineDto.roomNo?.trim(),
        day: updateClassRoutineDto.day,
        startTime: updateClassRoutineDto.startTime,
        endTime: updateClassRoutineDto.endTime,
        status: updateClassRoutineDto.status,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.classRoutine.delete({
      where: { id },
    });

    return { message: 'Class routine deleted successfully' };
  }

  private async validateUniqueRoutineCode(
    routineCode: string,
    ignoreRoutineId?: string,
  ) {
    const existingRoutine = await this.prisma.classRoutine.findUnique({
      where: {
        routineCode: routineCode.trim(),
      },
    });

    if (existingRoutine && existingRoutine.id !== ignoreRoutineId) {
      throw new BadRequestException('Routine ID already exists');
    }
  }

  private validateTimeRange(startTime: string, endTime: string) {
    if (startTime >= endTime) {
      throw new BadRequestException('End time must be later than start time');
    }
  }
}
