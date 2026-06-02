import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { HolidayStatus, HolidayType } from '../../../../generated/prisma/enums';

export class UpdateHolidayDto {
  @IsOptional()
  @IsString()
  holidayCode?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(HolidayType)
  holidayType?: HolidayType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(HolidayStatus)
  status?: HolidayStatus;
}
