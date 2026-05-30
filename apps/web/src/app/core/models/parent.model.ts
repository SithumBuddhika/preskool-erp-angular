export type ParentRelation = 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER';
export type ParentStatus = 'ACTIVE' | 'INACTIVE';

export type Parent = {
  id: string;
  fullName: string;
  email?: string | null;
  phone: string;
  relation: ParentRelation;
  occupation?: string | null;
  address?: string | null;
  status: ParentStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateParentPayload = {
  fullName: string;
  email?: string;
  phone: string;
  relation: ParentRelation;
  occupation?: string;
  address?: string;
  status?: ParentStatus;
};
