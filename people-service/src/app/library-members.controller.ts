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
import { CreateLibraryMemberDto } from './dto/create-library-member.dto';
import { UpdateLibraryMemberDto } from './dto/update-library-member.dto';
import { LibraryMembersService } from './library-members.service';

@Controller('library-members')
export class LibraryMembersController {
  constructor(private readonly libraryMembersService: LibraryMembersService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.libraryMembersService.findAll(search);
  }

  @Get('next-code')
  generateNextCode() {
    return this.libraryMembersService.generateNextCode();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.libraryMembersService.findOne(id);
  }

  @Post()
  create(@Body() createLibraryMemberDto: CreateLibraryMemberDto) {
    return this.libraryMembersService.create(createLibraryMemberDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateLibraryMemberDto: UpdateLibraryMemberDto,
  ) {
    return this.libraryMembersService.update(id, updateLibraryMemberDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.libraryMembersService.remove(id);
  }
}
