import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponse } from './types/auth-user.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }
}
