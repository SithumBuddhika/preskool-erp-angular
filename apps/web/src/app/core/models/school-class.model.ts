export type ClassStatus = 'ACTIVE' | 'INACTIVE';

export type SchoolClass = {
  id: string;
  className: string;
  section: string;
  classTeacher?: string | null;
  roomNo?: string | null;
  capacity?: number | null;
  status: ClassStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateClassPayload = {
  className: string;
  section: string;
  classTeacher?: string;
  roomNo?: string;
  capacity?: number;
  status?: ClassStatus;
};
