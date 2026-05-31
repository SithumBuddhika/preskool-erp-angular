import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
  RoutineDay,
  TimeTableStatus,
} from '../../../../generated/prisma/enums';

export class CreateTimeTableDto {
  @IsString()
  @IsNotEmpty()
  timeTableCode!: string;

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
  @IsEnum(TimeTableStatus)
  status?: TimeTableStatus;
}
