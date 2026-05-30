import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  GuardianRelation,
  GuardianStatus,
} from '../../../../generated/prisma/enums';

export class CreateGuardianDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsEnum(GuardianRelation)
  relation!: GuardianRelation;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(GuardianStatus)
  status?: GuardianStatus;
}
