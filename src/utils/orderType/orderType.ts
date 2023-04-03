import OrderAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/order/order.entity';
import { noop } from 'lodash';
import { OrderServiceUtil } from '../order/orderUtil.service';

export type OrderCodeType = 'PK' | 'PD' | 'PU';

export type OrderType = {
  code: OrderCodeType;
};
export interface CheckOrderInterface {
  validator: (order: any) => Promise<any>;
}
class DeliveryClass implements CheckOrderInterface {
  order: Partial<OrderAttributes>;
  constructor(order: Partial<OrderAttributes>) {
    this.order = order;
  }
  async validator(order: any) {
    order.deliveryPrice = Math.random() * 8.99 + 2.0;
    return undefined;
  }
}
class TakeawayClass implements CheckOrderInterface {
  order: Partial<OrderAttributes>;
  constructor(order: Partial<OrderAttributes>) {
    this.order = order;
  }
  async validator(order: any) {
    return order;
  }
}
class PickupClass implements CheckOrderInterface {
  order: Partial<OrderAttributes>;
  instance: OrderServiceUtil;
  constructor(order: Partial<OrderAttributes>, instance: OrderServiceUtil) {
    this.order = order;
    this.instance = instance;
  }
  async validator(order: any): Promise<any> {
    const validation = await this.instance.validateScheduleWarehouse(order);
    return validation;
  }
}

export default class CheckOrderClass implements CheckOrderInterface {
  constructor({
    orderType,
    order,
    instance,
  }: {
    orderType: OrderType;
    order: Partial<OrderAttributes>;
    instance?: OrderServiceUtil;
  }) {
    if (orderType.code === 'PK') {
      return new PickupClass(order, instance);
    } else if (orderType.code === 'PD') {
      return new DeliveryClass(order);
    } else if (orderType.code === 'PU') {
      return new TakeawayClass(order);
    }
  }
  async validator(order: any) {
    return noop();
  }
}
