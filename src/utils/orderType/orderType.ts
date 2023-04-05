import OrderAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/order/order.entity';
import { get, isEmpty, noop, size } from 'lodash';
import { OrderServiceUtil } from '../order/orderUtil.service';
import { deliveryCourier } from '../delivery/delivery';

export type OrderCodeType = 'OTM0002' | 'OTM0001';

export enum OrderCodeTypeEnum {
  DELIVERY = 'OTM0001',
  PICKUP = 'OTM0002',
}

export enum ValidationTypeEnum {
  CREATE = 'create',
  PRE_CREATE = 'preCreate',
}

export type OrderType = {
  code: OrderCodeType;
};
export interface CheckOrderInterface {
  validator: (order: any) => Promise<any>;
}

/**
 * @description Delivery class
 * @class DeliveryClass
 * @implements {CheckOrderInterface}
 */
class DeliveryClass implements CheckOrderInterface {
  order: Partial<OrderAttributes> & any;
  instance: OrderServiceUtil;
  type: ValidationTypeEnum;
  constructor(order: Partial<OrderAttributes>, instance: OrderServiceUtil, type: ValidationTypeEnum) {
    this.order = order;
    this.instance = instance;
    this.type = type;
  }
  async validator(order: OrderAttributes & any): Promise<any> {
    this.order = order ?? this.order;
    const body = [
      {
        origin: {
          country: this.order?.warehouse?.address?.country,
          locationOne: this.order?.warehouse?.address?.locationOne,
          locationTwo: this.order?.warehouse?.address?.locationTwo,
          locationThree: this.order?.warehouse?.address?.locationThree,
          address: this.order?.warehouse?.address?.address,
          reference: this.order?.warehouse?.address?.reference,
          latitude: this.order?.warehouse?.address?.latitude,
          longitude: this.order?.warehouse?.address?.longitude,
        },
        destiny: {
          country: this.order?.userAddress?.country,
          locationOne: this.order?.userAddress?.locationOne,
          locationTwo: this.order?.userAddress?.locationTwo,
          locationThree: this.order?.userAddress?.locationThree,
          address: this.order?.userAddress?.address,
          reference: this.order?.userAddress?.reference,
          latitude: this.order?.userAddress?.latitude,
          longitude: this.order?.userAddress?.longitude,
        },
        couriers: this.order?.warehouse?.couriers ?? [],
      },
    ];
    const [validation, couriers] = await Promise.all([
      this.instance.validateScheduleWarehouse(this.order, OrderCodeTypeEnum.DELIVERY, this.order.deliveryDate),
      deliveryCourier(body),
    ]);
    let couriersValidation;
    if (this.type === ValidationTypeEnum.CREATE) {
      const courier = get(order, 'courier', {});
      const courierFind = couriers.find((item) => item.id === courier.id);
      if (!courierFind) {
        couriersValidation = {
          message: 'Courier not available',
          errorCode: 'COURIER_NOT_AVAILABLE',
        };
      }
    } else {
      if (size(couriers) <= 0 && !isEmpty(this.order.userAddress)) {
        couriersValidation = {
          message: 'No couriers available',
          errorCode: 'NO_COURIERS_AVAILABLE',
        };
      }
    }

    return { validation, couriers, couriersValidation };
  }
}

/**
 * @description Pickup class
 * @class PickupClass
 * @implements {CheckOrderInterface}
 */
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

/**
 * @description Check order class
 * @class CheckOrderClass
 * @implements {CheckOrderInterface}
 */

export default class CheckOrderClass implements CheckOrderInterface {
  constructor({
    orderType,
    order,
    instance,
    type,
  }: {
    orderType: OrderType;
    order: Partial<OrderAttributes>;
    instance?: OrderServiceUtil;
    type: ValidationTypeEnum;
  }) {
    if (orderType.code === OrderCodeTypeEnum.PICKUP) {
      return new PickupClass(order, instance);
    } else if (orderType.code === OrderCodeTypeEnum.DELIVERY) {
      return new DeliveryClass(order, instance, type);
    }
  }
  async validator(order: any) {
    return noop();
  }
}
