import { Component } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';

function passwordsMatchValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!password || !confirmPassword) return null;

  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent {
  showPassword = false;
  showConfirmPassword = false;

  resetForm = new FormGroup(
    {
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(7)],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: [passwordsMatchValidator] },
  );

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  submitResetPassword(): void {
    this.resetForm.markAllAsTouched();

    if (this.resetForm.invalid) return;

    console.log('Reset password:', this.resetForm.getRawValue());
  }

  get passwordInvalid(): boolean {
    const password = this.resetForm.controls.password;
    return password.invalid && password.touched;
  }

  get confirmPasswordInvalid(): boolean {
    const confirmPassword = this.resetForm.controls.confirmPassword;
    return (
      confirmPassword.touched &&
      (confirmPassword.invalid || this.resetForm.hasError('passwordMismatch'))
    );
  }
}
