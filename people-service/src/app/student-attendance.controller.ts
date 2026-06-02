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
import { CreateStudentAttendanceDto } from './dto/create-student-attendance.dto';
import { UpdateStudentAttendanceDto } from './dto/update-student-attendance.dto';
import { StudentAttendanceService } from './student-attendance.service';

@Controller('student-attendance')
export class StudentAttendanceController {
  constructor(
    private readonly studentAttendanceService: StudentAttendanceService,
  ) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.studentAttendanceService.findAll(search);
  }

  @Get('next-code')
  generateNextCode() {
    return this.studentAttendanceService.generateNextCode();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentAttendanceService.findOne(id);
  }

  @Post()
  create(@Body() createStudentAttendanceDto: CreateStudentAttendanceDto) {
    return this.studentAttendanceService.create(createStudentAttendanceDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateStudentAttendanceDto: UpdateStudentAttendanceDto,
  ) {
    return this.studentAttendanceService.update(id, updateStudentAttendanceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentAttendanceService.remove(id);
  }
}
