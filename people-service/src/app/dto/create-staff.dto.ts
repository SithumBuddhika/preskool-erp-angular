import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  StaffEmploymentType,
  StaffGender,
  StaffStatus,
} from '../../../../generated/prisma/enums';

export class CreateStaffDto {
  @IsString()
  @IsNotEmpty()
  staffCode!: string;

  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsEnum(StaffGender)
  gender!: StaffGender;

  @IsOptional()
  @IsString()
  departmentCode?: string;

  @IsString()
  @IsNotEmpty()
  departmentName!: string;

  @IsOptional()
  @IsString()
  designationCode?: string;

  @IsString()
  @IsNotEmpty()
  designation!: string;

  @IsEnum(StaffEmploymentType)
  employmentType!: StaffEmploymentType;

  @IsDateString()
  joiningDate!: string;

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
