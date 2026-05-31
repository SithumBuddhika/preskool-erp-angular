export type GradeResult = 'PASS' | 'FAIL';
export type GradeStatus = 'DRAFT' | 'PUBLISHED';

export interface Grade {
  id: string;
  gradeCode: string;
  examCode: string;
  examName: string;
  className: string;
  section: string;
  subjectName: string;
  teacherName: string;
  admissionNo: string;
  studentName: string;
  marksObtained: number;
  maxMarks: number;
  minMarks: number;
  result: GradeResult;
  gradeLetter: string;
  status: GradeStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateGradePayload = {
  gradeCode: string;
  examCode: string;
  examName: string;
  className: string;
  section: string;
  subjectName: string;
  teacherName: string;
  admissionNo: string;
  studentName: string;
  marksObtained: number;
  maxMarks: number;
  minMarks: number;
  status: GradeStatus;
};

export type UpdateGradePayload = Partial<CreateGradePayload>;
