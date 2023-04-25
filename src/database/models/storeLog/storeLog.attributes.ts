interface StoreLog {
  id: number;
  store: string;
  devicename: string;
  registertime: string;
  registerdate: string;
  ordernumber: string;
  _deleted: boolean;
}

export class StoreLogAttributes implements StoreLog {
  id: number;
  store: string;
  devicename: string;
  registertime: string;
  registerdate: string;
  ordernumber: string;
  _deleted: boolean;
  serverDateToDate: Date;
}
