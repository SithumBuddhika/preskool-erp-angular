export type HostelType = 'BOYS' | 'GIRLS' | 'MIXED';

export type HostelStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';

export type Hostel = {
  id: string;
  hostelCode: string;
  hostelName: string;
  hostelType: HostelType;
  wardenName?: string | null;
  phone?: string | null;
  address?: string | null;
  totalRooms: number;
  totalBeds: number;
  availableBeds: number;
  monthlyFee?: number | null;
  status: HostelStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateHostelPayload = {
  hostelCode: string;
  hostelName: string;
  hostelType: HostelType;
  wardenName?: string;
  phone?: string;
  address?: string;
  totalRooms?: number;
  totalBeds?: number;
  availableBeds?: number;
  monthlyFee?: number;
  status?: HostelStatus;
  notes?: string;
};
