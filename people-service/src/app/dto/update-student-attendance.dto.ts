import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { StudentAttendanceStatus } from '../../../../generated/prisma/enums';

export class UpdateStudentAttendanceDto {
  @IsOptional()
  @IsString()
  attendanceCode?: string;

  @IsOptional()
  @IsString()
  studentAdmissionNo?: string;

  @IsOptional()
  @IsString()
  studentName?: string;

  @IsOptional()
  @IsString()
  className?: string;

  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsDateString()
  attendanceDate?: string;

  @IsOptional()
  @IsEnum(StudentAttendanceStatus)
  status?: StudentAttendanceStatus;

  @IsOptional()
  @IsString()
  checkInTime?: string;

  @IsOptional()
  @IsString()
  checkOutTime?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
