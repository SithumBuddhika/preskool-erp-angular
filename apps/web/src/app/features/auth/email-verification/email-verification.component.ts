import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-email-verification',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './email-verification.component.html',
  styleUrl: './email-verification.component.scss',
})
export class EmailVerificationComponent {
  verifyForm = new FormGroup({
    code: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(6),
      ],
    }),
  });

  submitVerification(): void {
    this.verifyForm.markAllAsTouched();

    if (this.verifyForm.invalid) return;

    console.log('Email verification:', this.verifyForm.getRawValue());
  }
}
