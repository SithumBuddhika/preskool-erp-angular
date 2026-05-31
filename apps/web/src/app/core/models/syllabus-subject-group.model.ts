export type SyllabusSubjectGroupStatus = 'ACTIVE' | 'INACTIVE';

export interface SyllabusSubjectGroup {
  id: string;
  groupCode: string;
  groupName: string;
  className: string;
  section: string;
  classTeacher?: string | null;
  subjectNames: string[];
  subjectCodes: string[];
  totalSubjects: number;
  status: SyllabusSubjectGroupStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateSyllabusSubjectGroupPayload = {
  groupCode: string;
  groupName: string;
  className: string;
  section: string;
  classTeacher?: string;
  subjectNames: string[];
  subjectCodes: string[];
  status: SyllabusSubjectGroupStatus;
};

export type UpdateSyllabusSubjectGroupPayload =
  Partial<CreateSyllabusSubjectGroupPayload>;
