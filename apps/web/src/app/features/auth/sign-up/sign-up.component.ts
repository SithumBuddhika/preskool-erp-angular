import { Component, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

function passwordsMatchValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!password || !confirmPassword) {
    return null;
  }

  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss',
})
export class SignUpComponent {
  showPassword = false;
  showConfirmPassword = false;
  isSubmitting = signal(false);
  serverError = signal('');

  signUpForm = new FormGroup(
    {
      fullName: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(/^[A-Za-z\s]+$/)],
      }),
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(7)],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      agreeTerms: new FormControl(false, {
        nonNullable: true,
        validators: [Validators.requiredTrue],
      }),
    },
    {
      validators: [passwordsMatchValidator],
    },
  );

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  submitSignUp(): void {
    this.signUpForm.markAllAsTouched();
    this.serverError.set('');

    if (this.signUpForm.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);

    const { fullName, email, password } = this.signUpForm.getRawValue();

    this.authService.register({ fullName, email, password }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigateByUrl('/dashboard/admin');
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.serverError.set(
          error?.error?.message || 'Sign up failed. Please try again.',
        );
      },
    });
  }

  get fullNameInvalid(): boolean {
    const fullName = this.signUpForm.controls.fullName;
    return fullName.invalid && fullName.touched;
  }

  get emailInvalid(): boolean {
    const email = this.signUpForm.controls.email;
    return email.invalid && email.touched;
  }

  get passwordInvalid(): boolean {
    const password = this.signUpForm.controls.password;
    return password.invalid && password.touched;
  }

  get confirmPasswordInvalid(): boolean {
    const confirmPassword = this.signUpForm.controls.confirmPassword;
    return (
      confirmPassword.touched &&
      (confirmPassword.invalid || this.signUpForm.hasError('passwordMismatch'))
    );
  }

  get termsInvalid(): boolean {
    const agreeTerms = this.signUpForm.controls.agreeTerms;
    return agreeTerms.invalid && agreeTerms.touched;
  }
}
