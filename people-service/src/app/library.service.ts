import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateLibraryBookDto } from './dto/create-library-book.dto';
import { UpdateLibraryBookDto } from './dto/update-library-book.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class LibraryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.libraryBook.findMany({
      where: search
        ? {
            OR: [
              { bookCode: { contains: search, mode: 'insensitive' } },
              { bookTitle: { contains: search, mode: 'insensitive' } },
              { isbn: { contains: search, mode: 'insensitive' } },
              { author: { contains: search, mode: 'insensitive' } },
              { category: { contains: search, mode: 'insensitive' } },
              { publisher: { contains: search, mode: 'insensitive' } },
              { shelfNo: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const book = await this.prisma.libraryBook.findUnique({
      where: { id },
    });

    if (!book) {
      throw new NotFoundException('Library book not found');
    }

    return book;
  }

  async generateNextCode() {
    const books = await this.prisma.libraryBook.findMany({
      select: {
        bookCode: true,
      },
    });

    const highestNumber = books.reduce((highest, book) => {
      const match = book.bookCode.match(/\d+/);
      const codeNumber = match ? Number(match[0]) : 0;

      return codeNumber > highest ? codeNumber : highest;
    }, 0);

    return {
      bookCode: `LIB-${String(highestNumber + 1).padStart(4, '0')}`,
    };
  }

  async create(createLibraryBookDto: CreateLibraryBookDto) {
    await this.validateUniqueBookCode(createLibraryBookDto.bookCode);

    if (createLibraryBookDto.isbn?.trim()) {
      await this.validateUniqueIsbn(createLibraryBookDto.isbn);
    }

    this.validateCopyCount(
      createLibraryBookDto.totalCopies,
      createLibraryBookDto.availableCopies,
    );

    return this.prisma.libraryBook.create({
      data: {
        bookCode: createLibraryBookDto.bookCode.trim(),
        bookTitle: createLibraryBookDto.bookTitle.trim(),
        isbn: createLibraryBookDto.isbn?.trim() || null,
        author: createLibraryBookDto.author.trim(),
        category: createLibraryBookDto.category.trim(),
        publisher: createLibraryBookDto.publisher?.trim() || null,
        totalCopies: createLibraryBookDto.totalCopies,
        availableCopies: createLibraryBookDto.availableCopies,
        shelfNo: createLibraryBookDto.shelfNo?.trim() || null,
        status: createLibraryBookDto.status || 'AVAILABLE',
        description: createLibraryBookDto.description?.trim() || null,
      },
    });
  }

  async update(id: string, updateLibraryBookDto: UpdateLibraryBookDto) {
    const existingBook = await this.findOne(id);

    if (updateLibraryBookDto.bookCode) {
      await this.validateUniqueBookCode(updateLibraryBookDto.bookCode, id);
    }

    if (updateLibraryBookDto.isbn?.trim()) {
      await this.validateUniqueIsbn(updateLibraryBookDto.isbn, id);
    }

    const nextTotalCopies =
      updateLibraryBookDto.totalCopies ?? existingBook.totalCopies;

    const nextAvailableCopies =
      updateLibraryBookDto.availableCopies ?? existingBook.availableCopies;

    this.validateCopyCount(nextTotalCopies, nextAvailableCopies);

    return this.prisma.libraryBook.update({
      where: { id },
      data: {
        bookCode: updateLibraryBookDto.bookCode?.trim(),
        bookTitle: updateLibraryBookDto.bookTitle?.trim(),
        isbn:
          updateLibraryBookDto.isbn !== undefined
            ? updateLibraryBookDto.isbn?.trim() || null
            : undefined,
        author: updateLibraryBookDto.author?.trim(),
        category: updateLibraryBookDto.category?.trim(),
        publisher:
          updateLibraryBookDto.publisher !== undefined
            ? updateLibraryBookDto.publisher?.trim() || null
            : undefined,
        totalCopies: updateLibraryBookDto.totalCopies,
        availableCopies: updateLibraryBookDto.availableCopies,
        shelfNo:
          updateLibraryBookDto.shelfNo !== undefined
            ? updateLibraryBookDto.shelfNo?.trim() || null
            : undefined,
        status: updateLibraryBookDto.status,
        description:
          updateLibraryBookDto.description !== undefined
            ? updateLibraryBookDto.description?.trim() || null
            : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.libraryBook.delete({
      where: { id },
    });

    return {
      message: 'Library book deleted successfully',
    };
  }

  private validateCopyCount(totalCopies: number, availableCopies: number) {
    if (availableCopies > totalCopies) {
      throw new BadRequestException(
        'Available copies cannot be greater than total copies',
      );
    }
  }

  private async validateUniqueBookCode(
    bookCode: string,
    ignoreBookId?: string,
  ) {
    const existingBook = await this.prisma.libraryBook.findUnique({
      where: {
        bookCode: bookCode.trim(),
      },
    });

    if (existingBook && existingBook.id !== ignoreBookId) {
      throw new BadRequestException('Book ID already exists');
    }
  }

  private async validateUniqueIsbn(isbn: string, ignoreBookId?: string) {
    const existingBook = await this.prisma.libraryBook.findUnique({
      where: {
        isbn: isbn.trim(),
      },
    });

    if (existingBook && existingBook.id !== ignoreBookId) {
      throw new BadRequestException('ISBN already exists');
    }
  }
}
