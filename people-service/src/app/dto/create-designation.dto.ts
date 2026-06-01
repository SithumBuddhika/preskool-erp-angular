import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DesignationStatus } from '../../../../generated/prisma/enums';

export class CreateDesignationDto {
  @IsString()
  @IsNotEmpty()
  designationCode!: string;

  @IsString()
  @IsNotEmpty()
  designationName!: string;

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
