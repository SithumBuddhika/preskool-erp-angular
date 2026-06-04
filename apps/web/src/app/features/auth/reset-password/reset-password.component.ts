import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  showPassword = false;
  showConfirmPassword = false;

  token = signal('');
  isSubmitting = signal(false);
  serverError = signal('');
  successMessage = signal('');

  resetForm = new FormGroup({
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(7)],
    }),
    confirmPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token') || '';

    this.token.set(token);

    if (!token) {
      this.serverError.set('Invalid reset link. Please request a new one.');
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  submitResetPassword(): void {
    this.resetForm.markAllAsTouched();
    this.serverError.set('');
    this.successMessage.set('');

    if (!this.token()) {
      this.serverError.set('Invalid reset link. Please request a new one.');
      return;
    }

    if (this.resetForm.invalid || this.isSubmitting()) {
      return;
    }

    const { password, confirmPassword } = this.resetForm.getRawValue();

    if (password !== confirmPassword) {
      this.serverError.set('Passwords do not match.');
      return;
    }

    this.isSubmitting.set(true);

    this.authService
      .resetPassword({
        token: this.token(),
        password,
      })
      .subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          this.successMessage.set(response.message);

          setTimeout(() => {
            this.router.navigateByUrl('/auth/login');
          }, 1800);
        },
        error: (error) => {
          this.isSubmitting.set(false);
          this.serverError.set(
            error?.error?.message ||
              'Failed to reset password. Please request a new reset link.',
          );
        },
      });
  }

  get passwordInvalid(): boolean {
    const password = this.resetForm.controls.password;
    return password.invalid && password.touched;
  }

  get confirmPasswordInvalid(): boolean {
    const confirmPassword = this.resetForm.controls.confirmPassword;
    return confirmPassword.invalid && confirmPassword.touched;
  }
}
