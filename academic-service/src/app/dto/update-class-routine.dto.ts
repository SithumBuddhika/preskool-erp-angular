import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
  ClassRoutineStatus,
  RoutineDay,
} from '../../../../generated/prisma/enums';

export class UpdateClassRoutineDto {
  @IsOptional()
  @IsString()
  routineCode?: string;

  @IsOptional()
  @IsString()
  className?: string;

  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsString()
  subjectName?: string;

  @IsOptional()
  @IsString()
  teacherName?: string;

  @IsOptional()
  @IsString()
  roomNo?: string;

  @IsOptional()
  @IsEnum(RoutineDay)
  day?: RoutineDay;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsEnum(ClassRoutineStatus)
  status?: ClassRoutineStatus;
}
