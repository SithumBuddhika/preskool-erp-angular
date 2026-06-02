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
import { CreateTeacherAttendanceDto } from './dto/create-teacher-attendance.dto';
import { UpdateTeacherAttendanceDto } from './dto/update-teacher-attendance.dto';
import { TeacherAttendanceService } from './teacher-attendance.service';

@Controller('teacher-attendance')
export class TeacherAttendanceController {
  constructor(
    private readonly teacherAttendanceService: TeacherAttendanceService,
  ) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.teacherAttendanceService.findAll(search);
  }

  @Get('next-code')
  generateNextCode() {
    return this.teacherAttendanceService.generateNextCode();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teacherAttendanceService.findOne(id);
  }

  @Post()
  create(@Body() createTeacherAttendanceDto: CreateTeacherAttendanceDto) {
    return this.teacherAttendanceService.create(createTeacherAttendanceDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTeacherAttendanceDto: UpdateTeacherAttendanceDto,
  ) {
    return this.teacherAttendanceService.update(id, updateTeacherAttendanceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.teacherAttendanceService.remove(id);
  }
}
