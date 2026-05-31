import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ExamStatus } from '../../../../generated/prisma/enums';

export class CreateExamDto {
  @IsString()
  @IsNotEmpty()
  examCode!: string;

  @IsString()
  @IsNotEmpty()
  examName!: string;

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

  @IsDateString()
  examDate!: string;

  @IsString()
  @IsNotEmpty()
  startTime!: string;

  @IsString()
  @IsNotEmpty()
  endTime!: string;

  @IsInt()
  @Min(1)
  maxMarks!: number;

  @IsInt()
  @Min(0)
  minMarks!: number;

  @IsOptional()
  @IsEnum(ExamStatus)
  status?: ExamStatus;
}
