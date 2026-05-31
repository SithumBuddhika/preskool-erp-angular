import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { GradeStatus } from '../../../../generated/prisma/enums';

export class CreateGradeDto {
  @IsString()
  @IsNotEmpty()
  gradeCode!: string;

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
  admissionNo!: string;

  @IsString()
  @IsNotEmpty()
  studentName!: string;

  @IsInt()
  @Min(0)
  marksObtained!: number;

  @IsInt()
  @Min(1)
  maxMarks!: number;

  @IsInt()
  @Min(0)
  minMarks!: number;

  @IsOptional()
  @IsEnum(GradeStatus)
  status?: GradeStatus;
}
