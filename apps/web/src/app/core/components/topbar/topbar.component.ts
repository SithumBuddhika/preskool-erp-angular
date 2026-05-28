import { Component } from '@angular/core';
import { TablerIconComponent, provideTablerIcons } from 'angular-tabler-icons';
import {
  IconSearch,
  IconBell,
  IconMenu2,
  IconChevronDown,
} from 'angular-tabler-icons/icons';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [TablerIconComponent],
  providers: [
    provideTablerIcons({
      IconSearch,
      IconBell,
      IconMenu2,
      IconChevronDown,
    }),
  ],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
})
export class TopbarComponent {}
