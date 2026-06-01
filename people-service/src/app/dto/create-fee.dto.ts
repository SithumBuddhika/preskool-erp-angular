import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  FeePaymentMethod,
  FeePaymentStatus,
  FeeType,
} from '../../../../generated/prisma/enums';

export class CreateFeeDto {
  @IsString()
  @IsNotEmpty()
  receiptNo!: string;

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

  @IsEnum(FeeType)
  feeType!: FeeType;

  @IsNumber()
  amount!: number;

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
