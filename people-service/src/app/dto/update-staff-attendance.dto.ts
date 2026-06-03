import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { StaffAttendanceStatus } from '../../../../generated/prisma/enums';

export class UpdateStaffAttendanceDto {
  @IsOptional()
  @IsString()
  staffId?: string;

  @IsOptional()
  @IsString()
  staffCode?: string;

  @IsOptional()
  @IsString()
  staffName?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsDateString()
  attendanceDate?: string;

  @IsOptional()
  @IsEnum(StaffAttendanceStatus)
  status?: StaffAttendanceStatus;

  @IsOptional()
  @IsString()
  remarks?: string;
}
