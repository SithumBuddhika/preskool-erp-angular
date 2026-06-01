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
import { CreateFeeGroupDto } from './dto/create-fee-group.dto';
import { UpdateFeeGroupDto } from './dto/update-fee-group.dto';
import { FeeGroupsService } from './fee-groups.service';

@Controller('fee-groups')
export class FeeGroupsController {
  constructor(private readonly feeGroupsService: FeeGroupsService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.feeGroupsService.findAll(search);
  }

  @Get('next-code')
  generateNextCode() {
    return this.feeGroupsService.generateNextCode();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.feeGroupsService.findOne(id);
  }

  @Post()
  create(@Body() createFeeGroupDto: CreateFeeGroupDto) {
    return this.feeGroupsService.create(createFeeGroupDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFeeGroupDto: UpdateFeeGroupDto,
  ) {
    return this.feeGroupsService.update(id, updateFeeGroupDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.feeGroupsService.remove(id);
  }
}
