import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [ClassesController],
  providers: [ClassesService, PrismaService],
})
export class AppModule {}
