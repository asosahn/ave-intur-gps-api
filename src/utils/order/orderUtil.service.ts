import { Injectable, Logger } from '@nestjs/common';
import OrderAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/order/order.entity';
import CheckOrderClass, { OrderCodeType, OrderCodeTypeEnum, OrderType } from '../orderType/orderType';
import { UserService } from '../user/user.service';
import UserAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/user/user.entity';
import { toString, get, toLower, size, isNil, isUndefined, first } from 'lodash';
import { UserErrors } from '@albatrosdeveloper/ave-models-npm/lib/schemas/user/user.errors';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import WarehouseAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/warehouse/warehouse.entity';
import * as moment from 'moment-timezone';
import { ItemService } from '../item/item.service';
import { andAllWhere, buildQuery, Normalizers, Ops, where } from '@albatrosdeveloper/ave-utils-npm/lib/utils/query.util';
import BusinessPartnerAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/businessPartner/businessPartner.entity';

export type ValidationType = {
  error: boolean;
  message?: string;
  errorCode?: string;
};

export type OrderValidations = 'orderType' | 'orderWarehouseTime';
@Injectable()
export class OrderServiceUtil {
  private readonly logger = new Logger(OrderServiceUtil.name);
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly httpService: HttpService,

    private readonly itemService: ItemService,
  ) {}

  async validateLocationWarehouse(order: Partial<OrderAttributes>) {
    let validation: ValidationType = undefined;
    const warehouse = get(order, 'warehouse');
    if (!warehouse) {
      validation = {
        error: true,
        message: 'invalid warehouse location',
        errorCode: 'INVALID_WAREHOUSE_LOCATION',
      };
    }
    const warehouseLocation = get(warehouse, 'address.locationTwo.code');
    if (!warehouseLocation) {
      validation = {
        error: true,
        message: 'invalid warehouse location',
        errorCode: 'INVALID_WAREHOUSE_LOCATION',
      };
    }
    const orderLocation = get(order, 'userAddress.locationTwo.code');
    if (warehouseLocation !== orderLocation) {
      validation = {
        error: true,
        message: 'invalid warehouse location',
        errorCode: 'INVALID_WAREHOUSE_LOCATION',
      };
    }
    return validation;
  }

  async validateScheduleWarehouse(order: Partial<OrderAttributes>, type?: OrderCodeTypeEnum, dateTime?: Date | string) {
    let validation: ValidationType = undefined;
    if (type === OrderCodeTypeEnum.PICKUP && !dateTime) {
      return validation;
    }

    const warehouse = get(order, 'warehouse', {} as WarehouseAttributes);
    if (!warehouse) {
      return {
        error: true,
        message: 'not warehouse found',
        errorCode: 'NOT_WAREHOUSE_FOUND',
      };
    }
    const warehouseSchedule = get(warehouse, 'schedule', []);
    if (size(warehouseSchedule) <= 0) {
      return {
        error: true,
        message: 'not schedule for today',
        errorCode: 'NOT_SCHEDULE_FOR_TODAY',
      };
    }
    const momentConfig = dateTime ? moment(dateTime).locale('es') : moment().locale('es');
    const currentDayName = toLower(momentConfig.format('dddd'));
    const getSchedule = warehouseSchedule.find((scd) => toLower(scd.name) === currentDayName && scd.active === '1');
    if (!getSchedule) {
      validation = {
        error: true,
        message: 'not schedule for today',
        errorCode: 'NOT_SCHEDULE_FOR_TODAY',
      };
    }
    const { hourStart, hourEnd } = getSchedule;
    const start = moment(hourStart, 'HH:mm');
    const end = moment(hourEnd, 'HH:mm');
    const isBetween = momentConfig.isBetween(start, end);
    if (!isBetween) {
      validation = {
        error: true,
        message: 'not schedule for today',
        errorCode: 'NOT_SCHEDULE_FOR_TODAY',
      };
    }
    return validation;
  }

  async getWarehouse(order: Partial<OrderAttributes>, token?: string) {
    try {
      const API_WAREHOUSE_URL = this.configService.get('API_WAREHOUSE_URL');
      const wareHouseId = get(order, 'warehouse._id');
      if (!wareHouseId) {
        return undefined;
      }
      const query = buildQuery<WarehouseAttributes>(
        where('_id', Ops.eq(wareHouseId, Normalizers.ObjectId)),
        andAllWhere('_deleted', false),
        andAllWhere('active', '1'),
      );
      const encodedQuery = encodeURIComponent(JSON.stringify(query));
      // const { data } = await this.httpService.axiosRef.get<WarehouseAttributes>(`${API_WAREHOUSE_URL}/warehouse/byId/${toString(wareHouseId)}`, {
      const { data } = await this.httpService.axiosRef.get<WarehouseAttributes>(`${API_WAREHOUSE_URL}/warehouse?filter=${encodedQuery}`, {
        headers: {
          Authorization: token,
        },
      });
      return first(<any>data);
    } catch (error) {
      this.logger.error(error?.response?.data);
      throw error;
    }
  }

  async businessPartner(order: Partial<OrderAttributes>, token?: string) {
    try {
      const API_CLIENT_URL = this.configService.get('API_CLIENT_URL');
      const businessPartnerId = get(order, 'businessPartner._id');
      if (!businessPartnerId) {
        return undefined;
      }
      const query = buildQuery<BusinessPartnerAttributes>(
        where('_id', Ops.eq(businessPartnerId, Normalizers.ObjectId)),
        andAllWhere('_deleted', false),
        andAllWhere('active', '1'),
      );
      const encodedQuery = encodeURIComponent(JSON.stringify(query));
      // const { data } = await this.httpService.axiosRef.get<WarehouseAttributes>(`${API_CLIENT_URL}/warehouse/byId/${toString(wareHouseId)}`, {
      const { data } = await this.httpService.axiosRef.get<BusinessPartnerAttributes>(`${API_CLIENT_URL}/business-partner?filter=${encodedQuery}`, {
        headers: {
          Authorization: token,
        },
      });
      return first(<any>data);
    } catch (error) {
      this.logger.error(error?.response?.data);
      throw error;
    }
  }

  async getWarehouseWithOrderData(order: Partial<OrderAttributes>, token?: string) {
    try {
      return await this.getWarehouse(order, token);
    } catch (err) {
      return undefined;
    }
  }

  async getBusinessPartnerWithOrderData(order: Partial<OrderAttributes>, token?: string) {
    try {
      return await this.businessPartner(order, token);
    } catch (err) {
      return undefined;
    }
  }

  async userValidation(user: Partial<UserAttributes>, userAddress?: { _id: string }): Promise<Record<string, any>> {
    const userValidation = await this.userService.getUserById(<string>toString(user._id));
    let validation = undefined;
    if (!userValidation) {
      validation = {
        error: true,
        message: UserErrors.USER_NOT_FOUND,
      };
    }
    if (!isNil(userAddress) || !isUndefined(userAddress)) {
      const addresses = get(userValidation, 'address', []).filter((address) => address.active === '1' && userAddress._id === toString(address._id));
      if (size(addresses) <= 0) {
        validation = {
          error: true,
          message: 'USER_ADDRESS_NOT_FOUND',
        };
      }
    }

    return validation;
  }

  validateWarehouse(order: Partial<OrderAttributes>) {
    if (!get(order, 'warehouse._id')) {
      return {
        error: true,
        message: 'not warehouse found',
        errorCode: 'NOT_WAREHOUSE_FOUND',
      };
    }
    return undefined;
  }

  async validateStock(order: Partial<OrderAttributes>) {
    // Fetch all items associated with the order
    const getItems: Partial<OrderAttributes>[] | any[] = await this.itemService.findItemsForOrder(order);
    // Get the list of items from the order details
    const itemFromOrder = get(order, 'orderDetails', []);
    let validation = undefined;
    // Iterate through each item in the order
    itemFromOrder.forEach((item) => {
      // Initialize an empty array to store any errors associated with the item
      item.errors = [];
      item.itemId = item.item?._id;
      let itemFromStock = undefined;
      let realStock = 0;

      // If the item has no variant or attributes
      if (!item.variant) {
        // Find the item in the list of all items and get its stock from the warehouse
        itemFromStock = getItems.find((it) => toString(it._id) === toString(item.item?._id));
        realStock = get(itemFromStock, 'warehouseItem.stock', 0);
      } else {
        // If the item has a variant or attributes, find the item with the corresponding variant ID
        itemFromStock = getItems.find(
          (it) =>
            toString(it._id) === toString(item.item?._id) &&
            it.warehouseItem.variants.map((v) => toString(v._id)).includes(toString(item.variant?._id)),
        );
        // Get the stock for the specific variant
        realStock = get(
          get(itemFromStock, 'warehouseItem.variants', []).find((v) => toString(v._id) === toString(item.variant?._id)),
          'stock',
          0,
        );
      }

      // If the item was not found in the list of all items, add an error to the item
      if (!itemFromStock) {
        validation = {
          error: true,
          message: 'Item error found',
          errorCode: 'ITEM_ERROR_FOUND',
        };
        item.error = true;
        item.errors.push({
          error: true,
          message: 'item not found',
          errorCode: 'ITEM_NOT_FOUND',
        });
        return;
      }

      // Set the available stock for the item to the actual stock in the warehouse
      item.availableStock = realStock;

      // If the available stock is less than the quantity requested, add an error to the item
      if (realStock < item.quantity) {
        item.error = true;
        validation = {
          error: true,
          message: 'Item error found',
          errorCode: 'ITEM_ERROR_FOUND',
        };
        item.errors.push({
          error: true,
          message: 'stock not available',
          errorCode: 'STOCK_NOT_AVAILABLE',
        });
      }
    });

    return validation;
  }

  async checkOrderType(order: Partial<OrderAttributes>): Promise<Record<string, any> | { validation: Record<string, any> } | any> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const orderTypeValidation = new CheckOrderClass({
      orderType: <OrderType>(<unknown>order.orderType),
      order,
      instance: self,
    });
    return orderTypeValidation.validator(order);
  }
}
