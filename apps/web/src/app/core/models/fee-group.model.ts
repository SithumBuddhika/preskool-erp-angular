import { FeeType } from './fee.model';

export type FeeGroupStatus = 'ACTIVE' | 'INACTIVE';

export type FeeGroup = {
  id: string;
  feeGroupCode: string;
  feeGroupName: string;
  className?: string | null;
  section?: string | null;
  feeType: FeeType;
  amount: number;
  dueDays?: number | null;
  description?: string | null;
  status: FeeGroupStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateFeeGroupPayload = {
  feeGroupCode: string;
  feeGroupName: string;
  className?: string;
  section?: string;
  feeType: FeeType;
  amount: number;
  dueDays?: number;
  description?: string;
  status?: FeeGroupStatus;
};
