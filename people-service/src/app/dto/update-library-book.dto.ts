import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { LibraryBookStatus } from '../../../../generated/prisma/enums';

export class UpdateLibraryBookDto {
  @IsOptional()
  @IsString()
  bookCode?: string;

  @IsOptional()
  @IsString()
  bookTitle?: string;

  @IsOptional()
  @IsString()
  isbn?: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  publisher?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalCopies?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  availableCopies?: number;

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
