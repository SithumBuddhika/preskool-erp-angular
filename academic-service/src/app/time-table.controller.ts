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
import { CreateTimeTableDto } from './dto/create-time-table.dto';
import { UpdateTimeTableDto } from './dto/update-time-table.dto';
import { TimeTableService } from './time-table.service';

@Controller('time-table')
export class TimeTableController {
  constructor(private readonly timeTableService: TimeTableService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.timeTableService.findAll(search);
  }

  @Get('next-code')
  generateNextCode() {
    return this.timeTableService.generateNextCode();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.timeTableService.findOne(id);
  }

  @Post()
  create(@Body() createTimeTableDto: CreateTimeTableDto) {
    return this.timeTableService.create(createTimeTableDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTimeTableDto: UpdateTimeTableDto,
  ) {
    return this.timeTableService.update(id, updateTimeTableDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.timeTableService.remove(id);
  }
}
