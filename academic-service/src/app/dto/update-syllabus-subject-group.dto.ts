import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { SyllabusSubjectGroupStatus } from '../../../../generated/prisma/enums';

export class UpdateSyllabusSubjectGroupDto {
  @IsOptional()
  @IsString()
  groupCode?: string;

  @IsOptional()
  @IsString()
  groupName?: string;

  @IsOptional()
  @IsString()
  className?: string;

  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsString()
  classTeacher?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjectNames?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjectCodes?: string[];

  @IsOptional()
  @IsEnum(SyllabusSubjectGroupStatus)
  status?: SyllabusSubjectGroupStatus;
}
