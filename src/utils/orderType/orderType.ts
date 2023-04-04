import OrderAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/order/order.entity';
import { noop } from 'lodash';
import { OrderServiceUtil } from '../order/orderUtil.service';

export type OrderCodeType = 'OTM0002' | 'OTM0001';

export enum OrderCodeTypeEnum {
    DELIVERY = 'OTM0001',
    PICKUP = 'OTM0002',
}

export type OrderType = {
  code: OrderCodeType;
};
export interface CheckOrderInterface {
  validator: (order: any) => Promise<any>;
}
class DeliveryClass implements CheckOrderInterface {
  order: Partial<OrderAttributes>;
  instance: OrderServiceUtil;
  constructor(order: Partial<OrderAttributes>, instance: OrderServiceUtil) {
    this.order = order;
    this.instance = instance;
  }
  async validator(order: any): Promise<any> {
    const validation = await this.instance.validateScheduleWarehouse(order, OrderCodeTypeEnum.DELIVERY, order.deliveryDate);
    return { validation, couriers: [] };
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
    const validation = await this.instance.validateScheduleWarehouse(order, OrderCodeTypeEnum.PICKUP, order.programmedDate);
    return { validation };
  }
}

export default class CheckOrderClass implements CheckOrderInterface {
  constructor({ orderType, order, instance }: { orderType: OrderType; order: Partial<OrderAttributes>; instance?: OrderServiceUtil }) {
    if (orderType.code === OrderCodeTypeEnum.PICKUP) {
      return new PickupClass(order, instance);
    } else if (orderType.code === OrderCodeTypeEnum.DELIVERY) {
      return new DeliveryClass(order, instance);
    }
  }
  async validator(order: any) {
    return noop();
  }
}
