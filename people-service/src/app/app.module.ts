import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { DesignationsController } from './designations.controller';
import { DesignationsService } from './designations.service';
import { FeeGroupsController } from './fee-groups.controller';
import { FeeGroupsService } from './fee-groups.service';
import { FeesController } from './fees.controller';
import { FeesService } from './fees.service';
import { GuardiansController } from './guardians.controller';
import { GuardiansService } from './guardians.service';
import { HolidaysController } from './holidays.controller';
import { HolidaysService } from './holidays.service';
import { LeavesController } from './leaves.controller';
import { LeavesService } from './leaves.service';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';
import { ParentsController } from './parents.controller';
import { ParentsService } from './parents.service';
import { PrismaService } from './prisma.service';
import { StaffsController } from './staffs.controller';
import { StaffsService } from './staffs.service';
import { StudentAttendanceController } from './student-attendance.controller';
import { StudentAttendanceService } from './student-attendance.service';
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
    DesignationsController,
    StaffsController,
    HolidaysController,
    LeavesController,
    StudentAttendanceController,
    FeesController,
    FeeGroupsController,
    LibraryController,
  ],
  providers: [
    AppService,
    StudentsService,
    ParentsService,
    GuardiansService,
    TeachersService,
    DepartmentsService,
    DesignationsService,
    StaffsService,
    HolidaysService,
    LeavesService,
    StudentAttendanceService,
    FeesService,
    FeeGroupsService,
    LibraryService,
    PrismaService,
  ],
})
export class AppModule {}
