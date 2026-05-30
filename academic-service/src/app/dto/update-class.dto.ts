import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ClassStatus } from '../../../../generated/prisma/enums';

export class UpdateClassDto {
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
  @IsString()
  roomNo?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsEnum(ClassStatus)
  status?: ClassStatus;
}
