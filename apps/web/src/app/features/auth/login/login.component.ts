import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  showPassword = false;

  loginForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    rememberMe: new FormControl(true, {
      nonNullable: true,
    }),
  });

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  submitLogin(): void {
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) {
      return;
    }

    console.log('Login data:', this.loginForm.getRawValue());
  }

  get emailInvalid(): boolean {
    const email = this.loginForm.controls.email;
    return email.invalid && email.touched;
  }

  get passwordInvalid(): boolean {
    const password = this.loginForm.controls.password;
    return password.invalid && password.touched;
  }
}
