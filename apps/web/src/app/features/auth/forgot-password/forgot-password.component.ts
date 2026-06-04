import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  isSubmitting = signal(false);
  serverError = signal('');
  successMessage = signal('');

  forgotForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  submitForgotPassword(): void {
    this.forgotForm.markAllAsTouched();
    this.serverError.set('');
    this.successMessage.set('');

    if (this.forgotForm.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);

    const { email } = this.forgotForm.getRawValue();

    this.authService
      .forgotPassword({
        email: email.trim(),
      })
      .subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          this.successMessage.set(response.message);

          setTimeout(() => {
            this.router.navigateByUrl('/auth/reset-password-sent');
          }, 1200);
        },
        error: (error) => {
          this.isSubmitting.set(false);
          this.serverError.set(
            error?.error?.message ||
              'Failed to send reset link. Please try again.',
          );
        },
      });
  }

  get emailInvalid(): boolean {
    const email = this.forgotForm.controls.email;
    return email.invalid && email.touched;
  }
}
