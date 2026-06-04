import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateAdminStatusDto } from './dto/update-admin-status.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { VerifyLoginOtpDto } from './dto/verify-login-otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthRequest } from './types/auth-request.type';
import { AuthResponse, AuthUser, LoginResponse } from './types/auth-user.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(loginDto);
  }

  @Post('verify-login-otp')
  verifyLoginOtp(
    @Body() verifyLoginOtpDto: VerifyLoginOtpDto,
  ): Promise<AuthResponse> {
    return this.authService.verifyLoginOtp(verifyLoginOtpDto);
  }

  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() request: AuthRequest): Promise<AuthUser> {
    return this.authService.getMe(request.user!.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin-users')
  findAdminUsers(@Req() request: AuthRequest) {
    return this.authService.findAdminUsers(request.user!.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin-users')
  createAdminUser(
    @Req() request: AuthRequest,
    @Body() createAdminUserDto: CreateAdminUserDto,
  ) {
    return this.authService.createAdminUser(
      request.user!.sub,
      createAdminUserDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin-users/:id')
  updateAdminUser(
    @Req() request: AuthRequest,
    @Param('id') id: string,
    @Body() updateAdminUserDto: UpdateAdminUserDto,
  ) {
    return this.authService.updateAdminUser(
      request.user!.sub,
      id,
      updateAdminUserDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin-users/:id/status')
  updateAdminStatus(
    @Req() request: AuthRequest,
    @Param('id') id: string,
    @Body() updateAdminStatusDto: UpdateAdminStatusDto,
  ) {
    return this.authService.updateAdminStatus(
      request.user!.sub,
      id,
      updateAdminStatusDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin-users/:id')
  deleteAdminUser(@Req() request: AuthRequest, @Param('id') id: string) {
    return this.authService.deleteAdminUser(request.user!.sub, id);
  }
}
