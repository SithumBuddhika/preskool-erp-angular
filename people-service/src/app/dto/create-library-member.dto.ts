import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  LibraryMemberStatus,
  LibraryMemberType,
} from '../../../../generated/prisma/enums';

export class CreateLibraryMemberDto {
  @IsString()
  @IsNotEmpty()
  memberCode!: string;

  @IsEnum(LibraryMemberType)
  memberType!: LibraryMemberType;

  @IsOptional()
  @IsString()
  referenceCode?: string;

  @IsString()
  @IsNotEmpty()
  memberName!: string;

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

  @IsDateString()
  joinDate!: string;

  @IsOptional()
  @IsEnum(LibraryMemberStatus)
  status?: LibraryMemberStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
