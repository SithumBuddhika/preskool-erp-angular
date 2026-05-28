import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TablerIconComponent, provideTablerIcons } from 'angular-tabler-icons';
import {
  IconLayoutDashboard,
  IconUsers,
  IconSchool,
  IconBriefcase,
  IconReportAnalytics,
  IconSettings,
} from 'angular-tabler-icons/icons';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TablerIconComponent],
  providers: [
    provideTablerIcons({
      IconLayoutDashboard,
      IconUsers,
      IconSchool,
      IconBriefcase,
      IconReportAnalytics,
      IconSettings,
    }),
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  menuItems = [
    {
      label: 'Dashboard',
      route: '/dashboard/admin',
      icon: 'layout-dashboard',
    },
    {
      label: 'People',
      route: '/people/students',
      icon: 'users',
    },
    {
      label: 'Academic',
      route: '/academic/classes',
      icon: 'school',
    },
    {
      label: 'HRM',
      route: '/hrm/staff',
      icon: 'briefcase',
    },
    {
      label: 'Reports',
      route: '/reports/student',
      icon: 'report-analytics',
    },
    {
      label: 'Settings',
      route: '/settings',
      icon: 'settings',
    },
  ];
}
