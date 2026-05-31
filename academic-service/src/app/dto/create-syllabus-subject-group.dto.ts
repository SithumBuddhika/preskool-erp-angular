import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { SyllabusSubjectGroupStatus } from '../../../../generated/prisma/enums';

export class CreateSyllabusSubjectGroupDto {
  @IsString()
  @IsNotEmpty()
  groupCode!: string;

  @IsString()
  @IsNotEmpty()
  groupName!: string;

  @IsString()
  @IsNotEmpty()
  className!: string;

  @IsString()
  @IsNotEmpty()
  section!: string;

  @IsOptional()
  @IsString()
  classTeacher?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  subjectNames!: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjectCodes?: string[];

  @IsOptional()
  @IsEnum(SyllabusSubjectGroupStatus)
  status?: SyllabusSubjectGroupStatus;
}
