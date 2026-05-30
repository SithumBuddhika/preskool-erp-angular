import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ParentsController } from './parents.controller';
import { ParentsService } from './parents.service';
import { PrismaService } from './prisma.service';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [StudentsController, ParentsController],
  providers: [StudentsService, ParentsService, PrismaService],
})
export class AppModule {}
