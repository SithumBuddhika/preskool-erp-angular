import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

type ReportTab = {
  label: string;
  route: string;
};

@Component({
  selector: 'app-report-tabs',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './report-tabs.component.html',
  styleUrl: './report-tabs.component.scss',
})
export class ReportTabsComponent {
  tabs: ReportTab[] = [
    {
      label: 'Attendance Report',
      route: '/reports/attendance',
    },
    {
      label: 'Students Attendance Type',
      route: '/reports/student-attendance-type',
    },
    {
      label: 'Daily Attendance',
      route: '/reports/daily-attendance',
    },
    {
      label: 'Student Day Wise',
      route: '/reports/student-day-wise',
    },
    {
      label: 'Teacher Day Wise',
      route: '/reports/teacher-day-wise',
    },
    {
      label: 'Teacher Report',
      route: '/reports/teacher-report',
    },
    {
      label: 'Staff Day Wise',
      route: '/reports/staff-day-wise',
    },
    {
      label: 'Staff Report',
      route: '/reports/staff-report',
    },
  ];
}
