import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ExamStatus } from '../../../../generated/prisma/enums';

export class UpdateExamDto {
  @IsOptional()
  @IsString()
  examCode?: string;

  @IsOptional()
  @IsString()
  examName?: string;

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
  @IsDateString()
  examDate?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxMarks?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minMarks?: number;

  @IsOptional()
  @IsEnum(ExamStatus)
  status?: ExamStatus;
}
