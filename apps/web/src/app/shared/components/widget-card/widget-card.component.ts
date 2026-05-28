import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-widget-card',
  standalone: true,
  templateUrl: './widget-card.component.html',
  styleUrl: './widget-card.component.scss',
})
export class WidgetCardComponent {
  @Input({ required: true }) title = '';
  @Input() meta = '';
  @Input() large = false;
}
