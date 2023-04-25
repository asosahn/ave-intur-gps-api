import { Model, Mongoose, Schema } from 'mongoose';
import { StoreLogAttributes } from './storeLog.attributes';

export type StoreLogDocument = StoreLogAttributes & Document;
export const StoreLogSchema = new Schema(
  {
    id: Number,
    store: String,
    devicename: String,
    registertime: String,
    registerdate: String,
    ordernumber: String,
    _deleted: { type: Boolean, default: false },
    serverDateToDate: Date,
  },
  { timestamps: true },
);

const StoreLog = (mongoose: Mongoose) =>
  mongoose.model<StoreLogDocument>('StoreLog', StoreLogSchema, 'store_log') as Model<StoreLogDocument, Record<string, unknown>>;

export default StoreLog;
