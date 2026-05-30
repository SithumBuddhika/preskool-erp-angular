import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.scss',
})
export class StatCardComponent {
  @Input({ required: true }) short = '';
  @Input({ required: true }) label = '';
  @Input({ required: true }) value = '';
  @Input() badge = '0%';
  @Input() active = '0';
  @Input() inactive = '0';
  @Input() color = 'is-blue';
}
