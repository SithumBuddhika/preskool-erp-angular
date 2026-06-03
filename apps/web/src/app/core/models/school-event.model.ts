export type SchoolEventType =
  | 'MEETING'
  | 'HOLIDAY_EVENT'
  | 'EXAM_EVENT'
  | 'SPORTS_EVENT'
  | 'GENERAL';

export type SchoolEventAudience =
  | 'ALL'
  | 'STUDENTS'
  | 'TEACHERS'
  | 'STAFF'
  | 'PARENTS';

export type SchoolEventStatus = 'ACTIVE' | 'INACTIVE';

export type SchoolEvent = {
  id: string;
  title: string;
  eventType: SchoolEventType;
  audience: SchoolEventAudience;
  startDate: string;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  organizer?: string | null;
  description?: string | null;
  status: SchoolEventStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateSchoolEventPayload = {
  title: string;
  eventType?: SchoolEventType;
  audience?: SchoolEventAudience;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  organizer?: string;
  description?: string;
  status?: SchoolEventStatus;
};
