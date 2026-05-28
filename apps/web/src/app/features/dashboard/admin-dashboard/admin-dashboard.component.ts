import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent {
  statCards = [
    {
      short: 'S',
      label: 'Total Students',
      value: '3654',
      badge: '1.2%',
      active: '3643',
      inactive: '11',
      color: 'is-orange',
    },
    {
      short: 'T',
      label: 'Total Teachers',
      value: '284',
      badge: '1.2%',
      active: '254',
      inactive: '30',
      color: 'is-blue',
    },
    {
      short: 'SF',
      label: 'Total Staff',
      value: '162',
      badge: '1.2%',
      active: '161',
      inactive: '02',
      color: 'is-green',
    },
    {
      short: 'SB',
      label: 'Total Subjects',
      value: '82',
      badge: '1.2%',
      active: '81',
      inactive: '01',
      color: 'is-purple',
    },
  ];

  feeBars = [
    { collected: 72 },
    { collected: 84 },
    { collected: 78 },
    { collected: 86 },
    { collected: 79 },
    { collected: 68 },
    { collected: 62 },
    { collected: 76 },
    { collected: 83 },
  ];

  calendarDays = Array.from({ length: 35 }).map((_, index) => ({
    label: `${index + 1}`,
    active: [6, 7, 12, 27].includes(index + 1),
  }));
}
