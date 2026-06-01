import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  FeePaymentMethod,
  FeePaymentStatus,
  FeeType,
} from '../../../../generated/prisma/enums';

export class UpdateFeeDto {
  @IsOptional()
  @IsString()
  receiptNo?: string;

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
  @IsEnum(FeeType)
  feeType?: FeeType;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsNumber()
  paidAmount?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsDateString()
  paidDate?: string;

  @IsOptional()
  @IsEnum(FeePaymentStatus)
  paymentStatus?: FeePaymentStatus;

  @IsOptional()
  @IsEnum(FeePaymentMethod)
  paymentMethod?: FeePaymentMethod;

  @IsOptional()
  @IsString()
  notes?: string;
}
