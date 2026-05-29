import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TablerIconComponent, provideTablerIcons } from 'angular-tabler-icons';
import {
  IconBell,
  IconChevronDown,
  IconLogout,
  IconSearch,
} from 'angular-tabler-icons/icons';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [TablerIconComponent],
  providers: [
    provideTablerIcons({
      IconSearch,
      IconBell,
      IconChevronDown,
      IconLogout,
    }),
  ],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
})
export class TopbarComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  currentUser = this.authService.currentUser;

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/auth/login');
  }

  get displayName(): string {
    return this.currentUser()?.fullName || 'Admin User';
  }

  get displayRole(): string {
    return this.currentUser()?.role?.replace('_', ' ') || 'ADMIN';
  }

  get initials(): string {
    const name = this.displayName.trim();

    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }
}
