import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ClassRoomStatus } from '../../../../generated/prisma/enums';

export class CreateClassRoomDto {
  @IsString()
  @IsNotEmpty()
  roomNo!: string;

  @IsString()
  @IsNotEmpty()
  roomName!: string;

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
