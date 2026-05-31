export type ClassRoomStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';

export type ClassRoom = {
  id: string;
  roomNo: string;
  roomName: string;
  building?: string | null;
  floor?: string | null;
  capacity?: number | null;
  status: ClassRoomStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateClassRoomPayload = {
  roomNo: string;
  roomName: string;
  building?: string;
  floor?: string;
  capacity?: number;
  status?: ClassRoomStatus;
};
