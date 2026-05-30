import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-welcome-banner',
  standalone: true,
  templateUrl: './welcome-banner.component.html',
  styleUrl: './welcome-banner.component.scss',
})
export class WelcomeBannerComponent {
  @Input() title = 'Welcome Back, Mr. Herald';
  @Input() subtitle = 'Have a Good day at work';
  @Input() updatedText = 'Updated Recently on 15 Jun 2024';
}
