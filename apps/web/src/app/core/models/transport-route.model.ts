export type TransportRouteStatus = 'ACTIVE' | 'INACTIVE';

export type TransportRoutePoint = {
  label?: string;
  lat: number;
  lng: number;
};

export type TransportRoute = {
  id: string;
  routeCode: string;
  routeName: string;
  startLocation: string;
  endLocation: string;
  stops?: string[] | null;
  routePoints?: TransportRoutePoint[] | null;
  distanceKm?: number | null;
  estimatedTime?: string | null;
  vehicleNo?: string | null;
  driverName?: string | null;
  status: TransportRouteStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateTransportRoutePayload = {
  routeCode: string;
  routeName: string;
  startLocation: string;
  endLocation: string;
  stops?: string[];
  routePoints?: TransportRoutePoint[];
  distanceKm?: number;
  estimatedTime?: string;
  vehicleNo?: string;
  driverName?: string;
  status?: TransportRouteStatus;
  notes?: string;
};
