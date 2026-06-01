import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { DepartmentStatus } from '../../../../generated/prisma/enums';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  departmentCode!: string;

  @IsString()
  @IsNotEmpty()
  departmentName!: string;

  @IsOptional()
  @IsString()
  headOfDepartment?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(DepartmentStatus)
  status?: DepartmentStatus;
}
