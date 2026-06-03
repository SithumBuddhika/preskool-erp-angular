import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  Matches,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../../../generated/prisma/enums';

export class CreateAdminUserDto {
  @IsNotEmpty()
  @Matches(/^[A-Za-z\s]+$/, {
    message: 'Name cannot contain numbers or special characters',
  })
  fullName!: string;

  @IsEmail()
  email!: string;

  @MinLength(7)
  password!: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
