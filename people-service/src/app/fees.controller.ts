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
import { CreateFeeDto } from './dto/create-fee.dto';
import { UpdateFeeDto } from './dto/update-fee.dto';
import { FeesService } from './fees.service';

@Controller('fees')
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.feesService.findAll(search);
  }

  @Get('next-code')
  generateNextCode() {
    return this.feesService.generateNextCode();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.feesService.findOne(id);
  }

  @Post()
  create(@Body() createFeeDto: CreateFeeDto) {
    return this.feesService.create(createFeeDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFeeDto: UpdateFeeDto) {
    return this.feesService.update(id, updateFeeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.feesService.remove(id);
  }
}
