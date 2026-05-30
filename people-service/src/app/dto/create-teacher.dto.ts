import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  TeacherGender,
  TeacherStatus,
} from '../../../../generated/prisma/enums';

export class CreateTeacherDto {
  @IsString()
  @IsNotEmpty()
  employeeNo!: string;

  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsEnum(TeacherGender)
  gender!: TeacherGender;

  @IsString()
  @IsNotEmpty()
  subject!: string;

  @IsOptional()
  @IsString()
  qualification?: string;

  @IsDateString()
  joiningDate!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(TeacherStatus)
  status?: TeacherStatus;
}
