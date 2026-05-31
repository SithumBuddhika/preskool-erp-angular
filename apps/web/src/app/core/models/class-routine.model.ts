export type RoutineDay =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export type ClassRoutineStatus = 'ACTIVE' | 'INACTIVE';

export interface ClassRoutine {
  id: number;
  routineCode: string;
  className: string;
  section: string;
  subjectName: string;
  teacherName: string;
  roomNo: string;
  day: RoutineDay;
  startTime: string;
  endTime: string;
  status: ClassRoutineStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateClassRoutinePayload = Omit<
  ClassRoutine,
  'id' | 'createdAt' | 'updatedAt'
>;

export type UpdateClassRoutinePayload = Partial<CreateClassRoutinePayload>;
