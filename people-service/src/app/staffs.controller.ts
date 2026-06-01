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
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffsService } from './staffs.service';

@Controller('staffs')
export class StaffsController {
  constructor(private readonly staffsService: StaffsService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.staffsService.findAll(search);
  }

  @Get('next-code')
  generateNextCode() {
    return this.staffsService.generateNextCode();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.staffsService.findOne(id);
  }

  @Post()
  create(@Body() createStaffDto: CreateStaffDto) {
    return this.staffsService.create(createStaffDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStaffDto: UpdateStaffDto) {
    return this.staffsService.update(id, updateStaffDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.staffsService.remove(id);
  }
}
