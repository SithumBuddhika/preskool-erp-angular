import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { FeeGroupStatus, FeeType } from '../../../../generated/prisma/enums';

export class UpdateFeeGroupDto {
  @IsOptional()
  @IsString()
  feeGroupCode?: string;

  @IsOptional()
  @IsString()
  feeGroupName?: string;

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
  @Min(0)
  amount?: number;

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
