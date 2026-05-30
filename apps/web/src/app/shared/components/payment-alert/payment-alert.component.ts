import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-payment-alert',
  standalone: true,
  templateUrl: './payment-alert.component.html',
  styleUrl: './payment-alert.component.scss',
})
export class PaymentAlertComponent {
  @Input() avatar = 'F';
  @Input() studentName = 'Fahed III,C';
  @Input() message = 'has paid Fees for the “Term1”';

  isVisible = true;

  closeAlert(): void {
    this.isVisible = false;
  }
}
