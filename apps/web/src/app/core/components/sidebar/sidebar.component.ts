import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TablerIconComponent, provideTablerIcons } from 'angular-tabler-icons';
import {
  IconBriefcase,
  IconChevronRight,
  IconLayoutDashboard,
  IconReportAnalytics,
  IconSchool,
  IconSettings,
  IconUsers,
} from 'angular-tabler-icons/icons';

type SidebarItem = {
  label: string;
  route: string;
  icon: string;
};

type SidebarSection = {
  title: string;
  items: SidebarItem[];
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TablerIconComponent],
  providers: [
    provideTablerIcons({
      IconBriefcase,
      IconChevronRight,
      IconLayoutDashboard,
      IconReportAnalytics,
      IconSchool,
      IconSettings,
      IconUsers,
    }),
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  sections: SidebarSection[] = [
    {
      title: 'Main',
      items: [
        {
          label: 'Dashboard',
          route: '/dashboard/admin',
          icon: 'layout-dashboard',
        },
        {
          label: 'Applications',
          route: '/applications',
          icon: 'settings',
        },
      ],
    },
    {
      title: 'Peoples',
      items: [
        {
          label: 'Students',
          route: '/people/students',
          icon: 'users',
        },
        {
          label: 'Parents',
          route: '/people/parents',
          icon: 'users',
        },
        {
          label: 'Guardians',
          route: '/people/guardians',
          icon: 'users',
        },
        {
          label: 'Teachers',
          route: '/people/teachers',
          icon: 'users',
        },
      ],
    },
    {
      title: 'Academic',
      items: [
        {
          label: 'Classes',
          route: '/academic/classes',
          icon: 'school',
        },
        {
          label: 'Class Room',
          route: '/academic/class-room',
          icon: 'school',
        },
        {
          label: 'Subject',
          route: '/academic/subject',
          icon: 'school',
        },
      ],
    },
    {
      title: 'Management',
      items: [
        {
          label: 'Fees Collection',
          route: '/management/fees',
          icon: 'briefcase',
        },
        {
          label: 'Library',
          route: '/management/library',
          icon: 'briefcase',
        },
      ],
    },
    {
      title: 'HRM',
      items: [
        {
          label: 'Staffs',
          route: '/hrm/staff',
          icon: 'briefcase',
        },
        {
          label: 'Departments',
          route: '/hrm/departments',
          icon: 'briefcase',
        },
      ],
    },
    {
      title: 'Reports',
      items: [
        {
          label: 'Attendance Report',
          route: '/reports/attendance',
          icon: 'report-analytics',
        },
        {
          label: 'Student Report',
          route: '/reports/student',
          icon: 'report-analytics',
        },
      ],
    },
  ];
}
