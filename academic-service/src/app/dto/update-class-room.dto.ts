import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ClassRoomStatus } from '../../../../generated/prisma/enums';

export class UpdateClassRoomDto {
  @IsOptional()
  @IsString()
  roomNo?: string;

  @IsOptional()
  @IsString()
  roomName?: string;

  @IsOptional()
  @IsString()
  building?: string;

  @IsOptional()
  @IsString()
  floor?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsEnum(ClassRoomStatus)
  status?: ClassRoomStatus;
}
