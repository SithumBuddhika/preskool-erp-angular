import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { GradeStatus } from '../../../../generated/prisma/enums';

export class UpdateGradeDto {
  @IsOptional()
  @IsString()
  gradeCode?: string;

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
  admissionNo?: string;

  @IsOptional()
  @IsString()
  studentName?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  marksObtained?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxMarks?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minMarks?: number;

  @IsOptional()
  @IsEnum(GradeStatus)
  status?: GradeStatus;
}
