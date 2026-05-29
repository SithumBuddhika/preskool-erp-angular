import { IsEmail, IsNotEmpty, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  @Matches(/^[A-Za-z\s]+$/, {
    message: 'Name cannot contain numbers or special characters',
  })
  fullName!: string;

  @IsEmail()
  email!: string;

  @MinLength(7)
  password!: string;
}
