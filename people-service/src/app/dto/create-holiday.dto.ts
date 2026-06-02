import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { HolidayStatus, HolidayType } from '../../../../generated/prisma/enums';

export class CreateHolidayDto {
  @IsString()
  @IsNotEmpty()
  holidayCode!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

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
