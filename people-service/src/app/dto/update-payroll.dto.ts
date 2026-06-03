import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PayrollStatus } from '../../../../generated/prisma/enums';

export class UpdatePayrollDto {
  @IsOptional()
  @IsString()
  payrollCode?: string;

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
  @IsString()
  salaryMonth?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  basicSalary?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  allowance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deduction?: number;

  @IsOptional()
  @IsEnum(PayrollStatus)
  status?: PayrollStatus;

  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
