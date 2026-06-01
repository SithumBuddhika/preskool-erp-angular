import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { LibraryBookStatus } from '../../../../generated/prisma/enums';

export class CreateLibraryBookDto {
  @IsString()
  @IsNotEmpty()
  bookCode!: string;

  @IsString()
  @IsNotEmpty()
  bookTitle!: string;

  @IsOptional()
  @IsString()
  isbn?: string;

  @IsString()
  @IsNotEmpty()
  author!: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsOptional()
  @IsString()
  publisher?: string;

  @IsInt()
  @Min(0)
  totalCopies!: number;

  @IsInt()
  @Min(0)
  availableCopies!: number;

  @IsOptional()
  @IsString()
  shelfNo?: string;

  @IsOptional()
  @IsEnum(LibraryBookStatus)
  status?: LibraryBookStatus;

  @IsOptional()
  @IsString()
  description?: string;
}
