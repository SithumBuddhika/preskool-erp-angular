import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClassRoomsController } from './class-rooms.controller';
import { ClassRoomsService } from './class-rooms.service';
import { ClassRoutinesController } from './class-routines.controller';
import { ClassRoutinesService } from './class-routines.service';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { PrismaService } from './prisma.service';
import { SubjectsController } from './subjects.controller';
import { SubjectsService } from './subjects.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [
    ClassesController,
    ClassRoomsController,
    SubjectsController,
    ClassRoutinesController,
  ],
  providers: [
    ClassesService,
    ClassRoomsService,
    SubjectsService,
    ClassRoutinesService,
    PrismaService,
  ],
})
export class AppModule {}
