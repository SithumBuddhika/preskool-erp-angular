import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  CreateSchoolEventPayload,
  SchoolEvent,
  SchoolEventAudience,
  SchoolEventStatus,
  SchoolEventType,
} from '../../../core/models/school-event.model';
import { EventsService } from '../../../core/services/events.service';

type ToastType = 'success' | 'error';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './events.component.html',
  styleUrl: './events.component.scss',
})
export class EventsComponent implements OnInit {
  events = signal<SchoolEvent[]>([]);
  selectedEvent = signal<SchoolEvent | null>(null);
  eventToDelete = signal<SchoolEvent | null>(null);

  isLoading = signal(false);
  isSubmitting = signal(false);
  isDeleting = signal(false);

  showEventModal = signal(false);
  serverError = signal('');

  searchTerm = signal('');
  selectedDate = signal('');
  selectedStatus = signal<SchoolEventStatus | 'ALL'>('ALL');

  toast = signal<{ message: string; type: ToastType } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  isEditMode = computed(() => this.selectedEvent() !== null);

  activeCount = computed(
    () => this.events().filter((event) => event.status === 'ACTIVE').length,
  );

  inactiveCount = computed(
    () => this.events().filter((event) => event.status === 'INACTIVE').length,
  );

  upcomingCount = computed(() => {
    const today = this.getTodayDate();

    return this.events().filter((event) => {
      const endDate = event.endDate ? this.toInputDate(event.endDate) : null;
      const startDate = this.toInputDate(event.startDate);

      return event.status === 'ACTIVE' && (endDate || startDate) >= today;
    }).length;
  });

  meetingCount = computed(
    () => this.events().filter((event) => event.eventType === 'MEETING').length,
  );

  eventForm = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    eventType: new FormControl<SchoolEventType>('GENERAL', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    audience: new FormControl<SchoolEventAudience>('ALL', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    startDate: new FormControl(this.getTodayDate(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    endDate: new FormControl('', {
      nonNullable: true,
    }),
    startTime: new FormControl('', {
      nonNullable: true,
    }),
    endTime: new FormControl('', {
      nonNullable: true,
    }),
    location: new FormControl('', {
      nonNullable: true,
    }),
    organizer: new FormControl('', {
      nonNullable: true,
    }),
    description: new FormControl('', {
      nonNullable: true,
    }),
    status: new FormControl<SchoolEventStatus>('ACTIVE', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor(private readonly eventsService: EventsService) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(
    search = this.searchTerm(),
    date = this.selectedDate(),
    status = this.selectedStatus(),
  ): void {
    this.isLoading.set(true);
    this.serverError.set('');

    const statusFilter = status === 'ALL' ? '' : status;

    this.eventsService.getEvents(search, date, statusFilter).subscribe({
      next: (events) => {
        this.events.set(events);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.serverError.set(error?.error?.message || 'Failed to load events.');
        this.isLoading.set(false);
        this.showToast('Failed to load events.', 'error');
      },
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.searchTerm.set(value);
    this.loadEvents(value, this.selectedDate(), this.selectedStatus());
  }

  onDateFilterChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.selectedDate.set(value);
    this.loadEvents(this.searchTerm(), value, this.selectedStatus());
  }

  onStatusFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as
      | SchoolEventStatus
      | 'ALL';

    this.selectedStatus.set(value);
    this.loadEvents(this.searchTerm(), this.selectedDate(), value);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedDate.set('');
    this.selectedStatus.set('ALL');
    this.loadEvents('', '', 'ALL');
  }

  openCreateModal(): void {
    this.selectedEvent.set(null);

    this.eventForm.reset({
      title: '',
      eventType: 'GENERAL',
      audience: 'ALL',
      startDate: this.getTodayDate(),
      endDate: '',
      startTime: '',
      endTime: '',
      location: '',
      organizer: '',
      description: '',
      status: 'ACTIVE',
    });

    this.serverError.set('');
    this.showEventModal.set(true);
  }

  openEditModal(event: SchoolEvent): void {
    this.selectedEvent.set(event);

    this.eventForm.reset({
      title: event.title,
      eventType: event.eventType,
      audience: event.audience,
      startDate: this.toInputDate(event.startDate),
      endDate: event.endDate ? this.toInputDate(event.endDate) : '',
      startTime: event.startTime || '',
      endTime: event.endTime || '',
      location: event.location || '',
      organizer: event.organizer || '',
      description: event.description || '',
      status: event.status,
    });

    this.serverError.set('');
    this.showEventModal.set(true);
  }

  closeEventModal(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.showEventModal.set(false);
    this.selectedEvent.set(null);
    this.serverError.set('');
  }

  saveEvent(): void {
    this.eventForm.markAllAsTouched();
    this.serverError.set('');

    if (this.eventForm.invalid || this.isSubmitting()) {
      return;
    }

    const payload = this.buildEventPayload();
    const selectedEvent = this.selectedEvent();

    if (payload.endDate && payload.endDate < payload.startDate) {
      this.serverError.set('End date cannot be before start date.');
      return;
    }

    this.isSubmitting.set(true);

    if (selectedEvent) {
      this.eventsService.updateEvent(selectedEvent.id, payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeEventModal();
          this.loadEvents();
          this.showToast('Event updated successfully.', 'success');
        },
        error: (error) => {
          this.isSubmitting.set(false);
          this.serverError.set(
            error?.error?.message || 'Failed to update event.',
          );
          this.showToast('Failed to update event.', 'error');
        },
      });

      return;
    }

    this.eventsService.createEvent(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeEventModal();
        this.loadEvents();
        this.showToast('Event created successfully.', 'success');
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.serverError.set(
          error?.error?.message || 'Failed to create event.',
        );
        this.showToast('Failed to create event.', 'error');
      },
    });
  }

  openDeleteModal(event: SchoolEvent): void {
    this.eventToDelete.set(event);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.eventToDelete.set(null);
  }

  confirmDeleteEvent(): void {
    const event = this.eventToDelete();

    if (!event || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);

    this.eventsService.deleteEvent(event.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.eventToDelete.set(null);
        this.loadEvents();
        this.showToast('Event deleted successfully.', 'success');
      },
      error: (error) => {
        this.isDeleting.set(false);
        this.eventToDelete.set(null);
        this.serverError.set(
          error?.error?.message || 'Failed to delete event.',
        );
        this.showToast('Failed to delete event.', 'error');
      },
    });
  }

  getEventTypeLabel(type: SchoolEventType): string {
    switch (type) {
      case 'HOLIDAY_EVENT':
        return 'Holiday Event';
      case 'EXAM_EVENT':
        return 'Exam Event';
      case 'SPORTS_EVENT':
        return 'Sports Event';
      case 'MEETING':
        return 'Meeting';
      case 'GENERAL':
      default:
        return 'General';
    }
  }

  getAudienceLabel(audience: SchoolEventAudience): string {
    switch (audience) {
      case 'STUDENTS':
        return 'Students';
      case 'TEACHERS':
        return 'Teachers';
      case 'STAFF':
        return 'Staff';
      case 'PARENTS':
        return 'Parents';
      case 'ALL':
      default:
        return 'All';
    }
  }

  getEventTypeClass(type: SchoolEventType): string {
    return `event-type-pill--${type.toLowerCase().replace('_', '-')}`;
  }

  getStatusClass(status: SchoolEventStatus): string {
    return status === 'ACTIVE'
      ? 'status-pill--active'
      : 'status-pill--inactive';
  }

  getEventIcon(type: SchoolEventType): string {
    switch (type) {
      case 'MEETING':
        return 'M';
      case 'HOLIDAY_EVENT':
        return 'H';
      case 'EXAM_EVENT':
        return 'E';
      case 'SPORTS_EVENT':
        return 'S';
      case 'GENERAL':
      default:
        return 'G';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  }

  formatDateRange(event: SchoolEvent): string {
    const startDate = this.formatDate(event.startDate);

    if (!event.endDate) {
      return startDate;
    }

    const endDate = this.formatDate(event.endDate);

    return startDate === endDate ? startDate : `${startDate} - ${endDate}`;
  }

  formatTimeRange(event: SchoolEvent): string {
    if (event.startTime && event.endTime) {
      return `${event.startTime} - ${event.endTime}`;
    }

    if (event.startTime) {
      return event.startTime;
    }

    return 'All Day';
  }

  isInvalid(controlName: keyof typeof this.eventForm.controls): boolean {
    const control = this.eventForm.controls[controlName];

    return control.invalid && control.touched;
  }

  private buildEventPayload(): CreateSchoolEventPayload {
    const formValue = this.eventForm.getRawValue();

    const payload: CreateSchoolEventPayload = {
      title: formValue.title.trim(),
      eventType: formValue.eventType,
      audience: formValue.audience,
      startDate: formValue.startDate,
      status: formValue.status,
    };

    if (formValue.endDate.trim()) {
      payload.endDate = formValue.endDate.trim();
    }

    if (formValue.startTime.trim()) {
      payload.startTime = formValue.startTime.trim();
    }

    if (formValue.endTime.trim()) {
      payload.endTime = formValue.endTime.trim();
    }

    if (formValue.location.trim()) {
      payload.location = formValue.location.trim();
    }

    if (formValue.organizer.trim()) {
      payload.organizer = formValue.organizer.trim();
    }

    if (formValue.description.trim()) {
      payload.description = formValue.description.trim();
    }

    return payload;
  }

  private toInputDate(date: string): string {
    return new Date(date).toISOString().slice(0, 10);
  }

  private getTodayDate(): string {
    const today = new Date();

    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(today.getDate()).padStart(2, '0')}`;
  }

  private showToast(message: string, type: ToastType): void {
    this.toast.set({ message, type });

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    this.toastTimer = setTimeout(() => {
      this.toast.set(null);
    }, 2800);
  }
}
