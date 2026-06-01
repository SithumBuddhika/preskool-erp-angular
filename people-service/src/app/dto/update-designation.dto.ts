import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DesignationStatus } from '../../../../generated/prisma/enums';

export class UpdateDesignationDto {
  @IsOptional()
  @IsString()
  designationCode?: string;

  @IsOptional()
  @IsString()
  designationName?: string;

  @IsOptional()
  @IsString()
  departmentCode?: string;

  @IsOptional()
  @IsString()
  departmentName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(DesignationStatus)
  status?: DesignationStatus;
}
