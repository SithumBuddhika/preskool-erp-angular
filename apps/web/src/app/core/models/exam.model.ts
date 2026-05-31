export type ExamStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export interface Exam {
  id: string;
  examCode: string;
  examName: string;
  className: string;
  section: string;
  subjectName: string;
  teacherName: string;
  roomNo: string;
  examDate: string;
  startTime: string;
  endTime: string;
  maxMarks: number;
  minMarks: number;
  status: ExamStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateExamPayload = Omit<Exam, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateExamPayload = Partial<CreateExamPayload>;
