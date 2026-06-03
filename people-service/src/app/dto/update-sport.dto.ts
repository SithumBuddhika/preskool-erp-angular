import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { SportStatus } from '../../../../generated/prisma/enums';

export class UpdateSportDto {
  @IsOptional()
  @IsString()
  sportCode?: string;

  @IsOptional()
  @IsString()
  sportName?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  coachName?: string;

  @IsOptional()
  @IsString()
  venue?: string;

  @IsOptional()
  @IsString()
  practiceDays?: string;

  @IsOptional()
  @IsString()
  practiceTime?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxParticipants?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  currentParticipants?: number;

  @IsOptional()
  @IsEnum(SportStatus)
  status?: SportStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
