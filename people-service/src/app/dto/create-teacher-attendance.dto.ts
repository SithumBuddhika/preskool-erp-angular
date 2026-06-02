import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { TeacherAttendanceStatus } from '../../../../generated/prisma/enums';

export class CreateTeacherAttendanceDto {
  @IsString()
  @IsNotEmpty()
  attendanceCode!: string;

  @IsOptional()
  @IsString()
  teacherEmployeeNo?: string;

  @IsString()
  @IsNotEmpty()
  teacherName!: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsDateString()
  attendanceDate!: string;

  @IsEnum(TeacherAttendanceStatus)
  status!: TeacherAttendanceStatus;

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
