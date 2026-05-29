import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  forgotForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  submitForgotPassword(): void {
    this.forgotForm.markAllAsTouched();

    if (this.forgotForm.invalid) return;

    console.log('Forgot password:', this.forgotForm.getRawValue());
  }

  get emailInvalid(): boolean {
    const email = this.forgotForm.controls.email;
    return email.invalid && email.touched;
  }
}
