import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-two-step-verification',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './two-step-verification.component.html',
  styleUrl: './two-step-verification.component.scss',
})
export class TwoStepVerificationComponent {
  twoStepForm = new FormGroup({
    one: new FormControl('', { nonNullable: true }),
    two: new FormControl('', { nonNullable: true }),
    three: new FormControl('', { nonNullable: true }),
    four: new FormControl('', { nonNullable: true }),
    five: new FormControl('', { nonNullable: true }),
    six: new FormControl('', { nonNullable: true }),
  });

  submitTwoStep(): void {
    const values = Object.values(this.twoStepForm.getRawValue()).join('');
    console.log('Two step code:', values);
  }
}
