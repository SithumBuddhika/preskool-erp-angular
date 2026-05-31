import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
  ClassRoutineStatus,
  RoutineDay,
} from '../../../../generated/prisma/enums';

export class CreateClassRoutineDto {
  @IsString()
  @IsNotEmpty()
  routineCode!: string;

  @IsString()
  @IsNotEmpty()
  className!: string;

  @IsString()
  @IsNotEmpty()
  section!: string;

  @IsString()
  @IsNotEmpty()
  subjectName!: string;

  @IsString()
  @IsNotEmpty()
  teacherName!: string;

  @IsString()
  @IsNotEmpty()
  roomNo!: string;

  @IsEnum(RoutineDay)
  day!: RoutineDay;

  @IsString()
  @IsNotEmpty()
  startTime!: string;

  @IsString()
  @IsNotEmpty()
  endTime!: string;

  @IsOptional()
  @IsEnum(ClassRoutineStatus)
  status?: ClassRoutineStatus;
}
