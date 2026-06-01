import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  StaffEmploymentType,
  StaffGender,
  StaffStatus,
} from '../../../../generated/prisma/enums';

export class UpdateStaffDto {
  @IsOptional()
  @IsString()
  staffCode?: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(StaffGender)
  gender?: StaffGender;

  @IsOptional()
  @IsString()
  departmentCode?: string;

  @IsOptional()
  @IsString()
  departmentName?: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsEnum(StaffEmploymentType)
  employmentType?: StaffEmploymentType;

  @IsOptional()
  @IsDateString()
  joiningDate?: string;

  @IsOptional()
  @IsNumber()
  salary?: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(StaffStatus)
  status?: StaffStatus;
}
