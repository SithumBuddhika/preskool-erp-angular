import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { LeaveStatus, LeaveType } from '../../../../generated/prisma/enums';

export class CreateLeaveDto {
  @IsString()
  @IsNotEmpty()
  leaveCode!: string;

  @IsOptional()
  @IsString()
  staffCode?: string;

  @IsString()
  @IsNotEmpty()
  staffName!: string;

  @IsOptional()
  @IsString()
  departmentCode?: string;

  @IsOptional()
  @IsString()
  departmentName?: string;

  @IsOptional()
  @IsString()
  designationCode?: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsEnum(LeaveType)
  leaveType!: LeaveType;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsString()
  @IsNotEmpty()
  reason!: string;

  @IsOptional()
  @IsEnum(LeaveStatus)
  status?: LeaveStatus;

  @IsOptional()
  @IsString()
  approvedBy?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
