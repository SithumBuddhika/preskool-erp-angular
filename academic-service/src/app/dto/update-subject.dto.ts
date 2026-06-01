import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { SubjectStatus } from '../../../../generated/prisma/enums';

export class UpdateSubjectDto {
  @IsOptional()
  @IsString()
  subjectCode?: string;

  @IsOptional()
  @IsString()
  subjectName?: string;

  @IsOptional()
  @IsString()
  className?: string;

  @IsOptional()
  @IsString()
  teacherName?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  weeklyHours?: number | null;

  @IsOptional()
  @IsEnum(SubjectStatus)
  status?: SubjectStatus;
}
