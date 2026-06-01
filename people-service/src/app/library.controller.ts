import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateLibraryBookDto } from './dto/create-library-book.dto';
import { UpdateLibraryBookDto } from './dto/update-library-book.dto';
import { LibraryService } from './library.service';

@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.libraryService.findAll(search);
  }

  @Get('next-code')
  generateNextCode() {
    return this.libraryService.generateNextCode();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.libraryService.findOne(id);
  }

  @Post()
  create(@Body() createLibraryBookDto: CreateLibraryBookDto) {
    return this.libraryService.create(createLibraryBookDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateLibraryBookDto: UpdateLibraryBookDto,
  ) {
    return this.libraryService.update(id, updateLibraryBookDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.libraryService.remove(id);
  }
}
