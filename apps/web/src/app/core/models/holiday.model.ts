export type HolidayType = 'PUBLIC' | 'SCHOOL' | 'EVENT' | 'OTHER';

export type HolidayStatus = 'ACTIVE' | 'INACTIVE';

export type Holiday = {
  id: string;
  holidayCode: string;
  title: string;
  startDate: string;
  endDate: string;
  holidayType: HolidayType;
  description?: string | null;
  status: HolidayStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateHolidayPayload = {
  holidayCode: string;
  title: string;
  startDate: string;
  endDate: string;
  holidayType?: HolidayType;
  description?: string;
  status?: HolidayStatus;
};
