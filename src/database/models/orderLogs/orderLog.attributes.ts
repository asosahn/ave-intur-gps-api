interface OrderLog {
  id: number;
  store: string;
  storename: string;
  ordernumber: string;
  servertime: string;
  serverdate: string;
  monitortime: string;
  attempt: number;
  _deleted: boolean;
}

export class OrderLogAttributes implements OrderLog {
  id: number;
  store: string;
  storename: string;
  ordernumber: string;
  servertime: string;
  serverdate: string;
  monitortime: string;
  attempt: number;
  _deleted: boolean;
  serverDateToDate: Date;
}
