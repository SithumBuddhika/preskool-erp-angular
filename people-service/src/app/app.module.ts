import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { FeesController } from './fees.controller';
import { FeesService } from './fees.service';
import { GuardiansController } from './guardians.controller';
import { GuardiansService } from './guardians.service';
import { ParentsController } from './parents.controller';
import { ParentsService } from './parents.service';
import { PrismaService } from './prisma.service';
import { StaffsController } from './staffs.controller';
import { StaffsService } from './staffs.service';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { TeachersController } from './teachers.controller';
import { TeachersService } from './teachers.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [
    AppController,
    StudentsController,
    ParentsController,
    GuardiansController,
    TeachersController,
    DepartmentsController,
    StaffsController,
    FeesController,
  ],
  providers: [
    AppService,
    StudentsService,
    ParentsService,
    GuardiansService,
    TeachersService,
    DepartmentsService,
    StaffsService,
    FeesService,
    PrismaService,
  ],
})
export class AppModule {}
