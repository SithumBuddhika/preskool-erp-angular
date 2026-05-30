export type GuardianRelation =
  | 'UNCLE'
  | 'AUNT'
  | 'GRANDFATHER'
  | 'GRANDMOTHER'
  | 'BROTHER'
  | 'SISTER'
  | 'OTHER';

export type GuardianStatus = 'ACTIVE' | 'INACTIVE';

export type Guardian = {
  id: string;
  fullName: string;
  email?: string | null;
  phone: string;
  relation: GuardianRelation;
  occupation?: string | null;
  address?: string | null;
  status: GuardianStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateGuardianPayload = {
  fullName: string;
  email?: string;
  phone: string;
  relation: GuardianRelation;
  occupation?: string;
  address?: string;
  status?: GuardianStatus;
};
