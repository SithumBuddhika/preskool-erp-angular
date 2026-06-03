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
import { CreateHostelDto } from './dto/create-hostel.dto';
import { UpdateHostelDto } from './dto/update-hostel.dto';
import { HostelsService } from './hostels.service';

@Controller('hostels')
export class HostelsController {
  constructor(private readonly hostelsService: HostelsService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.hostelsService.findAll(search);
  }

  @Get('next-code')
  generateNextCode() {
    return this.hostelsService.generateNextCode();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.hostelsService.findOne(id);
  }

  @Post()
  create(@Body() createHostelDto: CreateHostelDto) {
    return this.hostelsService.create(createHostelDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHostelDto: UpdateHostelDto) {
    return this.hostelsService.update(id, updateHostelDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.hostelsService.remove(id);
  }
}
