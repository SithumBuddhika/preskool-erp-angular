export type SubjectStatus = 'ACTIVE' | 'INACTIVE';

export type Subject = {
  id: string;
  subjectCode: string;
  subjectName: string;
  className?: string | null;
  teacherName?: string | null;
  weeklyHours?: number | null;
  status: SubjectStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateSubjectPayload = {
  subjectCode: string;
  subjectName: string;
  className?: string;
  teacherName?: string;
  weeklyHours?: number | null;
  status?: SubjectStatus;
};
