export type LibraryMemberType = 'STUDENT' | 'TEACHER' | 'STAFF';

export type LibraryMemberStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export type LibraryMember = {
  id: string;
  memberCode: string;
  memberType: LibraryMemberType;
  referenceCode?: string | null;
  memberName: string;
  className?: string | null;
  department?: string | null;
  phone?: string | null;
  email?: string | null;
  joinDate: string;
  status: LibraryMemberStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateLibraryMemberPayload = {
  memberCode: string;
  memberType: LibraryMemberType;
  referenceCode?: string;
  memberName: string;
  className?: string;
  department?: string;
  phone?: string;
  email?: string;
  joinDate: string;
  status?: LibraryMemberStatus;
  notes?: string;
};
