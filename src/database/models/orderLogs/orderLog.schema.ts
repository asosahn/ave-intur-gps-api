import { Model, Mongoose, Schema } from 'mongoose';
import { OrderLogAttributes } from './orderLog.attributes';

export type OrderLogDocument = OrderLogAttributes & Document;

export const OrderLogSchema = new Schema(
  {
    store: String,
    storename: String,
    ordernumber: String,
    servertime: String,
    serverdate: String,
    monitortime: String,
    attempt: { type: Number, default: 0 },
    _deleted: { type: Boolean, default: false },
    serverDateToDate: Date,
  },
  { timestamps: true },
);

const OrderLog = (mongoose: Mongoose) =>
  mongoose.model<OrderLogDocument>('OrderLog', OrderLogSchema, 'order_log') as Model<OrderLogDocument, Record<string, unknown>>;

export default OrderLog;
