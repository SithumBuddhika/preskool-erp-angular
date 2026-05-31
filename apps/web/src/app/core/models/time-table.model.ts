export type TimeTableDay =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export type TimeTableStatus = 'ACTIVE' | 'INACTIVE';

export interface TimeTable {
  id: string;
  timeTableCode: string;
  className: string;
  section: string;
  subjectName: string;
  teacherName: string;
  roomNo: string;
  day: TimeTableDay;
  startTime: string;
  endTime: string;
  status: TimeTableStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateTimeTablePayload = Omit<
  TimeTable,
  'id' | 'createdAt' | 'updatedAt'
>;

export type UpdateTimeTablePayload = Partial<CreateTimeTablePayload>;
