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
import { ClassRoomsService } from './class-rooms.service';
import { CreateClassRoomDto } from './dto/create-class-room.dto';
import { UpdateClassRoomDto } from './dto/update-class-room.dto';

@Controller('class-rooms')
export class ClassRoomsController {
  constructor(private readonly classRoomsService: ClassRoomsService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.classRoomsService.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.classRoomsService.findOne(id);
  }

  @Post()
  create(@Body() createClassRoomDto: CreateClassRoomDto) {
    return this.classRoomsService.create(createClassRoomDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateClassRoomDto: UpdateClassRoomDto,
  ) {
    return this.classRoomsService.update(id, updateClassRoomDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.classRoomsService.remove(id);
  }
}
