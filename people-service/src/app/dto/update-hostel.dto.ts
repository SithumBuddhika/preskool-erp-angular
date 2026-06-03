import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { HostelStatus, HostelType } from '../../../../generated/prisma/enums';

export class UpdateHostelDto {
  @IsOptional()
  @IsString()
  hostelCode?: string;

  @IsOptional()
  @IsString()
  hostelName?: string;

  @IsOptional()
  @IsEnum(HostelType)
  hostelType?: HostelType;

  @IsOptional()
  @IsString()
  wardenName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  totalRooms?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  totalBeds?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  availableBeds?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyFee?: number;

  @IsOptional()
  @IsEnum(HostelStatus)
  status?: HostelStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
