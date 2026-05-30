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
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';
import { GuardiansService } from './guardians.service';

@Controller('guardians')
export class GuardiansController {
  constructor(private readonly guardiansService: GuardiansService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.guardiansService.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.guardiansService.findOne(id);
  }

  @Post()
  create(@Body() createGuardianDto: CreateGuardianDto) {
    return this.guardiansService.create(createGuardianDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateGuardianDto: UpdateGuardianDto,
  ) {
    return this.guardiansService.update(id, updateGuardianDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.guardiansService.remove(id);
  }
}
