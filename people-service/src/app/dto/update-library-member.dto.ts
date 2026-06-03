import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  LibraryMemberStatus,
  LibraryMemberType,
} from '../../../../generated/prisma/enums';

export class UpdateLibraryMemberDto {
  @IsOptional()
  @IsString()
  memberCode?: string;

  @IsOptional()
  @IsEnum(LibraryMemberType)
  memberType?: LibraryMemberType;

  @IsOptional()
  @IsString()
  referenceCode?: string;

  @IsOptional()
  @IsString()
  memberName?: string;

  @IsOptional()
  @IsString()
  className?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsDateString()
  joinDate?: string;

  @IsOptional()
  @IsEnum(LibraryMemberStatus)
  status?: LibraryMemberStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
