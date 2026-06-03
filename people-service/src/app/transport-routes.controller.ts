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
import { CreateTransportRouteDto } from './dto/create-transport-route.dto';
import { UpdateTransportRouteDto } from './dto/update-transport-route.dto';
import { TransportRoutesService } from './transport-routes.service';

@Controller('transport-routes')
export class TransportRoutesController {
  constructor(
    private readonly transportRoutesService: TransportRoutesService,
  ) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.transportRoutesService.findAll(search);
  }

  @Get('next-code')
  generateNextCode() {
    return this.transportRoutesService.generateNextCode();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transportRoutesService.findOne(id);
  }

  @Post()
  create(@Body() createTransportRouteDto: CreateTransportRouteDto) {
    return this.transportRoutesService.create(createTransportRouteDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTransportRouteDto: UpdateTransportRouteDto,
  ) {
    return this.transportRoutesService.update(id, updateTransportRouteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.transportRoutesService.remove(id);
  }
}
