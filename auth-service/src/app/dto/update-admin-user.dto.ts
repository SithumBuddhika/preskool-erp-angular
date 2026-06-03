import {
  IsEmail,
  IsEnum,
  IsOptional,
  Matches,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../../../generated/prisma/enums';

export class UpdateAdminUserDto {
  @IsOptional()
  @Matches(/^[A-Za-z\s]+$/, {
    message: 'Name cannot contain numbers or special characters',
  })
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @MinLength(7)
  password?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
