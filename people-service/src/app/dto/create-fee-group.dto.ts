import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { FeeGroupStatus, FeeType } from '../../../../generated/prisma/enums';

export class CreateFeeGroupDto {
  @IsString()
  @IsNotEmpty()
  feeGroupCode!: string;

  @IsString()
  @IsNotEmpty()
  feeGroupName!: string;

  @IsOptional()
  @IsString()
  className?: string;

  @IsOptional()
  @IsString()
  section?: string;

  @IsEnum(FeeType)
  feeType!: FeeType;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  dueDays?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(FeeGroupStatus)
  status?: FeeGroupStatus;
}
