import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import {
  ParentDashboardData,
  ParentDashboardDataService,
  ParentDashboardEventItem,
} from '../../../core/services/parent-dashboard-data.service';

type CalendarDay = {
  label: string;
  dateKey: string;
  active: boolean;
  count: number;
  title: string;
  eventType?: string;
};

@Component({
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './parent-dashboard.component.html',
  styleUrl: './parent-dashboard.component.scss',
})
export class ParentDashboardComponent implements OnInit {
  dashboardData = signal<ParentDashboardData | null>(null);
  isLoading = signal(false);
  serverError = signal('');

  statCards = computed(() => this.dashboardData()?.statCards || []);
  attendanceSummary = computed(() => this.dashboardData()?.attendanceSummary);
  feeSummary = computed(() => this.dashboardData()?.feeSummary);
  childSummary = computed(() => this.dashboardData()?.childSummary);
  librarySummary = computed(() => this.dashboardData()?.librarySummary);
  upcomingEvents = computed(() => this.dashboardData()?.upcomingEvents || []);
  calendarEvents = computed(() => this.dashboardData()?.calendarEvents || []);
  recentAttendance = computed(
    () => this.dashboardData()?.recentAttendance || [],
  );

  currentMonthLabel = computed(() =>
    new Date().toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    }),
  );

  calendarDays = computed<CalendarDay[]>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();

    return Array.from({ length: totalDays }).map((_, index) => {
      const dayNumber = index + 1;
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(
        dayNumber,
      ).padStart(2, '0')}`;

      const dayEvents = this.calendarEvents().filter(
        (event) => event.dateKey === dateKey,
      );

      return {
        label: String(dayNumber),
        dateKey,
        active: dayEvents.length > 0,
        count: dayEvents.length,
        eventType: dayEvents[0]?.eventType,
        title:
          dayEvents.length > 0
            ? dayEvents
                .map(
                  (event) =>
                    `${event.title} (${this.formatEventType(event.eventType)})`,
                )
                .join(' | ')
            : 'No events for this date',
      };
    });
  });

  attendanceRingBackground = computed(() => {
    const rate = this.attendanceSummary()?.rate || 0;

    return `conic-gradient(#3d5ee1 0 ${rate}%, #22d3ee ${rate}% ${
      rate + 8
    }%, #eef1f6 ${rate + 8}% 100%)`;
  });

  constructor(
    private readonly parentDashboardDataService: ParentDashboardDataService,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);
    this.serverError.set('');

    this.parentDashboardDataService.getDashboardData().subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.serverError.set('Failed to load parent dashboard data.');
        this.isLoading.set(false);
      },
    });
  }

  currentParentName(): string {
    return this.authService.currentUser()?.fullName || 'Parent';
  }

  getCalendarDayClass(day: CalendarDay): string {
    if (!day.active) {
      return '';
    }

    return `has-${day.eventType?.toLowerCase().replace('_', '-') || 'event'}`;
  }

  formatMoney(value?: number): string {
    return `Rs. ${new Intl.NumberFormat('en-LK').format(
      Math.round(value || 0),
    )}`;
  }

  formatDate(date: string): string {
    if (!date) {
      return '-';
    }

    return new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      },
    );
  }

  formatEventDate(event: ParentDashboardEventItem): string {
    const startDate = this.formatDate(event.startDate);

    if (
      !event.endDate ||
      event.endDate.slice(0, 10) === event.startDate.slice(0, 10)
    ) {
      return `${startDate} / ${this.formatEventTime(event)}`;
    }

    return `${startDate} - ${this.formatDate(
      event.endDate,
    )} / ${this.formatEventTime(event)}`;
  }

  formatEventTime(event: ParentDashboardEventItem): string {
    if (event.startTime && event.endTime) {
      return `${event.startTime} - ${event.endTime}`;
    }

    if (event.startTime) {
      return event.startTime;
    }

    return 'All Day';
  }

  formatEventType(type: string): string {
    return type
      .split('_')
      .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
      .join(' ');
  }

  getEventIcon(type: string): string {
    switch (type) {
      case 'MEETING':
        return '🤝';
      case 'HOLIDAY_EVENT':
        return '🏖️';
      case 'EXAM_EVENT':
        return '📝';
      case 'SPORTS_EVENT':
        return '🏅';
      default:
        return '📅';
    }
  }

  getStatusLabel(status: string): string {
    if (status === 'HALF_DAY') {
      return 'Half Day';
    }

    if (status === 'N/A') {
      return 'N/A';
    }

    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  getStatusClass(status: string): string {
    return `status-pill--${status
      .toLowerCase()
      .replace(/_/g, '-')
      .replace(/[^a-z0-9-]/g, '-')}`;
  }
}
