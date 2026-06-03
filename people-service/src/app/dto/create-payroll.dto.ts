import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PayrollStatus } from '../../../../generated/prisma/enums';

export class CreatePayrollDto {
  @IsString()
  @IsNotEmpty()
  payrollCode!: string;

  @IsOptional()
  @IsString()
  staffCode?: string;

  @IsString()
  @IsNotEmpty()
  staffName!: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsString()
  @IsNotEmpty()
  salaryMonth!: string;

  @IsNumber()
  @Min(0)
  basicSalary!: number;

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
