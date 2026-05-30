import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  ParentRelation,
  ParentStatus,
} from '../../../../generated/prisma/enums';

export class CreateParentDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsEnum(ParentRelation)
  relation!: ParentRelation;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(ParentStatus)
  status?: ParentStatus;
}
