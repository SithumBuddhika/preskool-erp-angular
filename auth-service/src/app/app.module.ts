import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') ||
          'preskool_super_secret_change_later',
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN') ||
            '1d') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
})
export class AppModule {}
