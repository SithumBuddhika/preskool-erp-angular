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
import { ClassRoutinesService } from './class-routines.service';
import { CreateClassRoutineDto } from './dto/create-class-routine.dto';
import { UpdateClassRoutineDto } from './dto/update-class-routine.dto';

@Controller('class-routines')
export class ClassRoutinesController {
  constructor(private readonly classRoutinesService: ClassRoutinesService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.classRoutinesService.findAll(search);
  }

  @Get('next-code')
  generateNextCode() {
    return this.classRoutinesService.generateNextCode();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.classRoutinesService.findOne(id);
  }

  @Post()
  create(@Body() createClassRoutineDto: CreateClassRoutineDto) {
    return this.classRoutinesService.create(createClassRoutineDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateClassRoutineDto: UpdateClassRoutineDto,
  ) {
    return this.classRoutinesService.update(id, updateClassRoutineDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.classRoutinesService.remove(id);
  }
}
