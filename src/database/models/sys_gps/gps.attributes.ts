interface Coords {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  speed_accuracy: number;
  heading: number;
  heading_accuracy: number;
  altitude: number;
  altitude_accuracy: number;
}

interface GeoPoint {
  type: string;
  coordinates: number[];
}

interface Activity {
  type: string;
  confidence: number;
}

interface Battery {
  is_charging: boolean;
  level: number;
}

interface Location {
  event: string;
  is_moving: boolean;
  uuid: string;
  timestamp: string;
  timestampToDate: Date;
  odometer: number;
  coords: Coords;
  activity: Activity;
  battery: Battery;
  extras: Record<string, unknown>;
  timestampDate: string;
}

interface Data {
  location: Location;
}
export class GpsAttributes implements Data {
  location: Location;
  geoPoint: GeoPoint;
  userId: string;
  sessionId: string;
  orderCode: string;
  userNumber: string;
  userName: string;
  _deleted: boolean;
}
