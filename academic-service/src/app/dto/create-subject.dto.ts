import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { SubjectStatus } from '../../../../generated/prisma/enums';

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty()
  subjectCode!: string;

  @IsString()
  @IsNotEmpty()
  subjectName!: string;

  @IsOptional()
  @IsString()
  className?: string;

  @IsOptional()
  @IsString()
  teacherName?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  weeklyHours?: number;

  @IsOptional()
  @IsEnum(SubjectStatus)
  status?: SubjectStatus;
}
