import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
  RoutineDay,
  TimeTableStatus,
} from '../../../../generated/prisma/enums';

export class UpdateTimeTableDto {
  @IsOptional()
  @IsString()
  timeTableCode?: string;

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
  @IsEnum(TimeTableStatus)
  status?: TimeTableStatus;
}
