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
import { CreateStaffAttendanceDto } from './dto/create-staff-attendance.dto';
import { UpdateStaffAttendanceDto } from './dto/update-staff-attendance.dto';
import { StaffAttendanceService } from './staff-attendance.service';

@Controller('staff-attendance')
export class StaffAttendanceController {
  constructor(
    private readonly staffAttendanceService: StaffAttendanceService,
  ) {}

  @Get()
  findAll(@Query('search') search?: string, @Query('date') date?: string) {
    return this.staffAttendanceService.findAll(search, date);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.staffAttendanceService.findOne(id);
  }

  @Post()
  create(@Body() createStaffAttendanceDto: CreateStaffAttendanceDto) {
    return this.staffAttendanceService.create(createStaffAttendanceDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateStaffAttendanceDto: UpdateStaffAttendanceDto,
  ) {
    return this.staffAttendanceService.update(id, updateStaffAttendanceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.staffAttendanceService.remove(id);
  }
}
