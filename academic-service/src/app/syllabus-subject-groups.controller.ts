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
import { CreateSyllabusSubjectGroupDto } from './dto/create-syllabus-subject-group.dto';
import { UpdateSyllabusSubjectGroupDto } from './dto/update-syllabus-subject-group.dto';
import { SyllabusSubjectGroupsService } from './syllabus-subject-groups.service';

@Controller('syllabus-subject-groups')
export class SyllabusSubjectGroupsController {
  constructor(
    private readonly syllabusSubjectGroupsService: SyllabusSubjectGroupsService,
  ) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.syllabusSubjectGroupsService.findAll(search);
  }

  @Get('next-code')
  generateNextCode() {
    return this.syllabusSubjectGroupsService.generateNextCode();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.syllabusSubjectGroupsService.findOne(id);
  }

  @Post()
  create(@Body() createSyllabusSubjectGroupDto: CreateSyllabusSubjectGroupDto) {
    return this.syllabusSubjectGroupsService.create(
      createSyllabusSubjectGroupDto,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSyllabusSubjectGroupDto: UpdateSyllabusSubjectGroupDto,
  ) {
    return this.syllabusSubjectGroupsService.update(
      id,
      updateSyllabusSubjectGroupDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.syllabusSubjectGroupsService.remove(id);
  }
}
