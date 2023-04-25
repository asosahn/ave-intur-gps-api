import { Model, Mongoose, Schema, Document } from 'mongoose';
import { GpsAttributes } from './gps.attributes';

export type GpsDocument = GpsAttributes & Document;

const coordsSchema = new Schema({
  latitude: Number,
  longitude: Number,
  accuracy: Number,
  speed: Number,
  speed_accuracy: Number,
  heading: Number,
  heading_accuracy: Number,
  altitude: Number,
  altitude_accuracy: Number,
});

const geoPointSchema = new Schema({
  type: { type: String },
  coordinates: {
    type: [],
    index: '2dsphere',
  },
});

const activitySchema = new Schema({
  type: String,
  confidence: Number,
});

const batterySchema = new Schema({
  is_charging: Boolean,
  level: Number,
});

const locationSchema = new Schema({
  event: String,
  is_moving: Boolean,
  uuid: String,
  timestamp: String,
  timestampToDate: Date,
  odometer: Number,
  coords: coordsSchema,
  activity: activitySchema,
  battery: batterySchema,
  extras: Schema.Types.Mixed,
  _deleted: { type: Boolean, default: false },
  timestampDate: String,
});

export const GpsSchema = new Schema(
  {
    location: locationSchema,
    geoPoint: geoPointSchema,
    userId: String,
    sessionId: String,
    orderCode: String,
    userNumber: String,
    userName: String,
  },
  { timestamps: true },
);

const SysGps = (mongoose: Mongoose) => mongoose.model<GpsDocument>('SysGps', GpsSchema, 'sys_gps') as Model<GpsDocument, Record<string, unknown>>;

export default SysGps;
