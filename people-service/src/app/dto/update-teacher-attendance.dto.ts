import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { TeacherAttendanceStatus } from '../../../../generated/prisma/enums';

export class UpdateTeacherAttendanceDto {
  @IsOptional()
  @IsString()
  attendanceCode?: string;

  @IsOptional()
  @IsString()
  teacherEmployeeNo?: string;

  @IsOptional()
  @IsString()
  teacherName?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsDateString()
  attendanceDate?: string;

  @IsOptional()
  @IsEnum(TeacherAttendanceStatus)
  status?: TeacherAttendanceStatus;

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
