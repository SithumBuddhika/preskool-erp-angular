export type SportStatus = 'ACTIVE' | 'INACTIVE';

export type Sport = {
  id: string;
  sportCode: string;
  sportName: string;
  category?: string | null;
  coachName?: string | null;
  venue?: string | null;
  practiceDays?: string | null;
  practiceTime?: string | null;
  maxParticipants: number;
  currentParticipants: number;
  status: SportStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateSportPayload = {
  sportCode: string;
  sportName: string;
  category?: string;
  coachName?: string;
  venue?: string;
  practiceDays?: string;
  practiceTime?: string;
  maxParticipants?: number;
  currentParticipants?: number;
  status?: SportStatus;
  notes?: string;
};
