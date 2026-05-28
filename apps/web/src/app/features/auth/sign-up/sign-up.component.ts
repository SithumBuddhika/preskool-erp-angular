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

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  submitSignUp(): void {
    this.signUpForm.markAllAsTouched();

    if (this.signUpForm.invalid) {
      return;
    }

    console.log('Sign up data:', this.signUpForm.getRawValue());
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
