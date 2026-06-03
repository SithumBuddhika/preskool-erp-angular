import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { StaffAttendanceStatus } from '../../../../generated/prisma/enums';

export class CreateStaffAttendanceDto {
  @IsOptional()
  @IsString()
  staffId?: string;

  @IsString()
  @IsNotEmpty()
  staffCode!: string;

  @IsString()
  @IsNotEmpty()
  staffName!: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsDateString()
  attendanceDate!: string;

  @IsEnum(StaffAttendanceStatus)
  status!: StaffAttendanceStatus;

  @IsOptional()
  @IsString()
  remarks?: string;
}
