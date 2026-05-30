import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ClassStatus } from '../../../../generated/prisma/enums';

export class CreateClassDto {
  @IsString()
  @IsNotEmpty()
  className!: string;

  @IsString()
  @IsNotEmpty()
  section!: string;

  @IsOptional()
  @IsString()
  classTeacher?: string;

  @IsOptional()
  @IsString()
  roomNo?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsEnum(ClassStatus)
  status?: ClassStatus;
}
