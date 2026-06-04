import { IsEmail, IsNotEmpty, Length } from 'class-validator';

export class VerifyLoginOtpDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @Length(6, 6)
  otp!: string;
}
