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
import { CreateDesignationDto } from './dto/create-designation.dto';
import { UpdateDesignationDto } from './dto/update-designation.dto';
import { DesignationsService } from './designations.service';

@Controller('designations')
export class DesignationsController {
  constructor(private readonly designationsService: DesignationsService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.designationsService.findAll(search);
  }

  @Get('next-code')
  generateNextCode() {
    return this.designationsService.generateNextCode();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.designationsService.findOne(id);
  }

  @Post()
  create(@Body() createDesignationDto: CreateDesignationDto) {
    return this.designationsService.create(createDesignationDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDesignationDto: UpdateDesignationDto,
  ) {
    return this.designationsService.update(id, updateDesignationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.designationsService.remove(id);
  }
}
