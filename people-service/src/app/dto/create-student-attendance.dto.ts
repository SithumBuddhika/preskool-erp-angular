import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { StudentAttendanceStatus } from '../../../../generated/prisma/enums';

export class CreateStudentAttendanceDto {
  @IsString()
  @IsNotEmpty()
  attendanceCode!: string;

  @IsOptional()
  @IsString()
  studentAdmissionNo?: string;

  @IsString()
  @IsNotEmpty()
  studentName!: string;

  @IsString()
  @IsNotEmpty()
  className!: string;

  @IsOptional()
  @IsString()
  section?: string;

  @IsDateString()
  attendanceDate!: string;

  @IsEnum(StudentAttendanceStatus)
  status!: StudentAttendanceStatus;

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
