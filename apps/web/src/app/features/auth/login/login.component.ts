import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { isOtpRequiredResponse } from '../../../core/models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  showPassword = false;
  isSubmitting = signal(false);
  serverError = signal('');

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

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  submitLogin(): void {
    this.loginForm.markAllAsTouched();
    this.serverError.set('');

    if (this.loginForm.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);

    const { email, password } = this.loginForm.getRawValue();

    this.authService.login({ email, password }).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);

        if (isOtpRequiredResponse(response)) {
          this.authService.saveOtpEmail(response.email);
          this.router.navigate(['/auth/two-step-verification'], {
            queryParams: {
              email: response.email,
            },
          });
          return;
        }

        this.authService.saveSession(response);
        this.router.navigateByUrl('/dashboard/admin');
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.serverError.set(
          error?.error?.message || 'Login failed. Please try again.',
        );
      },
    });
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
