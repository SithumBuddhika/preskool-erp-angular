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
  selector: 'app-two-step-verification',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './two-step-verification.component.html',
  styleUrl: './two-step-verification.component.scss',
})
export class TwoStepVerificationComponent implements OnInit {
  email = signal('');
  isSubmitting = signal(false);
  serverError = signal('');
  successMessage = signal('');

  otpForm = new FormGroup({
    otp: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(6),
        Validators.pattern(/^[0-9]{6}$/),
      ],
    }),
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    const queryEmail = this.route.snapshot.queryParamMap.get('email') || '';
    const storedEmail = this.authService.getOtpEmail() || '';

    const email = queryEmail || storedEmail;

    this.email.set(email);

    if (!email) {
      this.serverError.set('Verification session expired. Please login again.');
    }
  }

  submitOtp(): void {
    this.otpForm.markAllAsTouched();
    this.serverError.set('');
    this.successMessage.set('');

    if (!this.email()) {
      this.serverError.set('Verification session expired. Please login again.');
      return;
    }

    if (this.otpForm.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);

    const { otp } = this.otpForm.getRawValue();

    this.authService
      .verifyLoginOtp({
        email: this.email(),
        otp: otp.trim(),
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.successMessage.set('Verification successful. Redirecting...');

          setTimeout(() => {
            this.router.navigateByUrl('/dashboard/admin');
          }, 700);
        },
        error: (error) => {
          this.isSubmitting.set(false);
          this.serverError.set(
            error?.error?.message || 'Invalid or expired verification code.',
          );
        },
      });
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const allowedKeys = [
      'Backspace',
      'Delete',
      'Tab',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
    ];

    if (allowedKeys.includes(event.key)) {
      return;
    }

    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  get otpInvalid(): boolean {
    const otp = this.otpForm.controls.otp;
    return otp.invalid && otp.touched;
  }
}
