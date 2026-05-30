import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import {
  ParentRelation,
  ParentStatus,
} from '../../../../generated/prisma/enums';

export class UpdateParentDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(ParentRelation)
  relation?: ParentRelation;

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
