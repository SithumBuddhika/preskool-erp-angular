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
          route: '/academic/class-rooms',
          icon: 'school',
        },
        {
          label: 'Subject',
          route: '/academic/subjects',
          icon: 'school',
        },
        {
          label: 'Class Routine',
          route: '/academic/class-routine',
          icon: 'school',
        },
        {
          label: 'Exam Schedule',
          route: '/academic/exam-schedule',
          icon: 'school',
        },
        {
          label: 'Grade',
          route: '/academic/grades',
          icon: 'school',
        },
        {
          label: 'Subject Group',
          route: '/academic/syllabus-subject-groups',
          icon: 'school',
        },
        {
          label: 'Time Table',
          route: '/academic/time-table',
          icon: 'school',
        },
      ],
    },
    {
      title: 'Management',
      items: [
        {
          label: 'Fee Groups',
          route: '/management/fee-groups',
          icon: 'briefcase',
        },
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
          route: '/hrm/staffs',
          icon: 'briefcase',
        },
        {
          label: 'Designations',
          route: '/hrm/designations',
          icon: 'briefcase',
        },
        {
          label: 'Departments',
          route: '/hrm/departments',
          icon: 'briefcase',
        },
        {
          label: 'Holidays',
          route: '/hrm/holidays',
          icon: 'briefcase',
        },
        {
          label: 'Leave',
          route: '/hrm/leaves',
          icon: 'briefcase',
        },
        {
          label: 'Student Attendance',
          route: '/hrm/student-attendance',
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
      ],
    },
  ];
}
