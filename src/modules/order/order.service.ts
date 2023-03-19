import OrderAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/order/order.entity';
import Order, {
  OrderDocument,
  OrderModelExt,
} from '@albatrosdeveloper/ave-models-npm/lib/schemas/order/order.schema';
import {
  OrderErrors,
  OrderErrorCodes,
} from '@albatrosdeveloper/ave-models-npm/lib/schemas/order/order.errors';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { isEmpty } from 'lodash';
import { LeanDocument } from 'mongoose';
import {
  andAllWhere,
  andWhere,
  buildQuery,
  CombinedFilter,
  Normalizers,
  Ops,
  seed,
  where,
} from '@albatrosdeveloper/ave-utils-npm/lib/utils/query.util';
import { DocumentWithCountInterface } from '@albatrosdeveloper/ave-models-npm/lib/methods/common/interfaces/interfaces';
import { catchError, firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import OrderTypeAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/orderType/orderType.entity';
import {
  OrderTypeErrors,
  OrderTypeErrorCodes,
} from '@albatrosdeveloper/ave-models-npm/lib/schemas/orderType/orderType.errors';
import BusinessPartnerAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/businessPartner/businessPartner.entity';
import {
  BusinessPartnerErrors,
  BusinessPartnerErrorCodes,
} from '@albatrosdeveloper/ave-models-npm/lib/schemas/businessPartner/businessPartner.errors';
import WarehouseAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/warehouse/warehouse.entity';
import {
  WarehouseErrors,
  WarehouseErrorCodes,
} from '@albatrosdeveloper/ave-models-npm/lib/schemas/warehouse/warehouse.errors';
import { OrderDetaillTemporalService } from '../order-detaill-temporal/order-detaill-temporal.service';
import { OrderDetaillService } from '../order-detaill/order-detaill.service';
import { OrderPayService } from '../order-pay/order-pay.service';
import { OrderLogService } from '../order-log/order-log.service';
import UserAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/user/user.entity';
import { UserErrors, UserErrorCodes } from '@albatrosdeveloper/ave-models-npm/lib/schemas/user/user.errors';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: OrderModelExt<OrderDocument>,
    private readonly httpService: HttpService,
    private orderDetaillTemporalService: OrderDetaillTemporalService,
    private orderDetailService: OrderDetaillService,
    private orderPayService: OrderPayService,
    private orderLogService: OrderLogService,
  ) {}

  async httpServiceGet<T>(
    api: string,
    filter: any,
    errorType: object,
  ): Promise<T> {
    const { data } = await firstValueFrom(
      this.httpService
        .get<T>(api, {
          params: filter,
        })
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(error.response.data);
            throw errorType;
          }),
        ),
    );
    return data;
  }

  async create(createOrderDto: CreateOrderDto): Promise<OrderAttributes> {
    try {
      const orderExist = await this.findAll(
        buildQuery<OrderAttributes>(where('code', createOrderDto.code)),
      );
      if (orderExist.length > 0) {
        throw {
          message: OrderErrors.ORDER_CODE_ALREADY_EXISTS,
          errorCode: OrderErrorCodes.ORDER_CODE_ALREADY_EXISTS,
        };
      }

      const user = await this.httpServiceGet<UserAttributes>(
        `${process.env.API_CLIENT_URL}/user/byId/${createOrderDto.userId}`,
        undefined,
        {
          message: UserErrors.USER_NOT_FOUND,
          errorCode: UserErrorCodes.USER_NOT_FOUND,
        },
      );
      // console.log(user, 'USER')

      const ordertype = await this.httpServiceGet<OrderTypeAttributes>(
        `${process.env.API_MASTER_URL}/order-type/byId/${createOrderDto.orderTypeId}`,
        undefined,
        {
          message: OrderTypeErrors.ORDER_TYPE_NOT_FOUND,
          errorCode: OrderTypeErrorCodes.ORDER_TYPE_NOT_FOUND,
        },
      );
      // console.log(ordertype, 'ORDER TYPE')

      const businessPartner =
        await this.httpServiceGet<BusinessPartnerAttributes>(
          `${process.env.API_CLIENT_URL}/business-partner/byId/${createOrderDto.businessPartnerId}`,
          undefined,
          {
            message: BusinessPartnerErrors.BUSINESS_PARTNER_NOT_FOUND,
            errorCode: BusinessPartnerErrorCodes.BUSINESS_PARTNER_NOT_FOUND,
          },
        );
      const warehouse = await this.httpServiceGet<WarehouseAttributes>(
        `${process.env.API_WAREHOUSE_URL}/warehouse/byId/${createOrderDto.warehouseId}`,
        undefined,
        {
          message: WarehouseErrors.WAREHOUSE_NOT_FOUND,
          errorCode: WarehouseErrorCodes.WAREHOUSE_NOT_FOUND,
        },
      );
      const orderDetaillTemporals = [];
      for (let orderDetaillTemporal of createOrderDto.orderDetaillTemporals) {
        const orderDetaillTemporalExist =
          await this.orderDetaillTemporalService.create(orderDetaillTemporal);
        orderDetaillTemporals.push(orderDetaillTemporalExist);
      }
      // console.log(orderDetaillTemporals, 'ORDER DETAILL TEMPORAL')

      const orderDetaills = [];
      for (let orderDetail of createOrderDto.orderDetaills) {
        const orderDetailExist = await this.orderDetailService.create(
          orderDetail,
        );
        orderDetaills.push(orderDetailExist);
      }
      // console.log(orderDetaills, 'ORDER DETAILL')

      const orderPays = [];
      for (let orderPay of createOrderDto.orderPays) {
        const orderPayExist = await this.orderPayService.create(orderPay);
        orderPays.push(orderPayExist);
      }
      console.log(orderPays, 'ORDER PAYS')

      const orderLogs = [];
      for (let orderLog of createOrderDto.orderLogs) {
        const orderLogExist = await this.orderLogService.create(orderLog);
        orderLogs.push(orderLogExist);
      }
      console.log(orderLogs, 'ORDER LOGS')

      const date = new Date(createOrderDto.deliveryDate)

      const newOrder = new this.orderModel({
        code: createOrderDto.code,
        user: user,
        userAddress: createOrderDto.userAddress,
        total: createOrderDto.total,
        tax: createOrderDto.tax,
        discount: createOrderDto.discount,
        deliveryPrice: createOrderDto.deliveryPrice,
        status: createOrderDto.status,
        orderType: ordertype,
        flagRTN: createOrderDto.flagRTN,
        RTN: createOrderDto.RTN,
        deliveryDate: date,
        originType: createOrderDto.originType,
        newTotal: createOrderDto.newTotal,
        businessPartner: businessPartner,
        warehouse: warehouse,
        orderDetaillTemporals: orderDetaillTemporals,
        orderDetaills: orderDetaills,
        orderPays: orderPays,
        orderLogs: orderLogs,
      });

      const orderNew = await this.orderModel.createGenId(newOrder);
      return orderNew;
    } catch (err) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: !isEmpty(err) ? err : err.message,
        },
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async findAll(filter: any): Promise<LeanDocument<OrderAttributes>[]> {
    try {
      const prepareQuery = buildQuery(
        seed(filter as CombinedFilter<OrderAttributes>),
        andAllWhere('_deleted', false),
      );
      return this.orderModel.getDocuments(prepareQuery);
    } catch (err) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: !isEmpty(err) ? err : err.message,
        },
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async findAllWithCount(filter: any): Promise<DocumentWithCountInterface> {
    try {
      const prepareQuery = buildQuery(
        seed(filter as CombinedFilter<OrderAttributes>),
        andAllWhere('_deleted', false),
      );
      return this.orderModel.getDocumentsWithCount(prepareQuery);
    } catch (err) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: !isEmpty(err) ? err : err.message,
        },
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async findAllCount(filter: any): Promise<number> {
    try {
      const prepareQuery = buildQuery(
        seed(filter as CombinedFilter<OrderAttributes>),
        andAllWhere('_deleted', false),
      );
      return this.orderModel.count(prepareQuery);
    } catch (err) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: !isEmpty(err) ? err : err.message,
        },
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async findOne(id: string): Promise<LeanDocument<OrderAttributes>> {
    try {
      const prepareQuery = buildQuery<OrderAttributes>(
        where('_id', Ops.eq(id, Normalizers.ObjectId)),
        andAllWhere('_deleted', false),
      );
      return this.orderModel.getDocument(prepareQuery);
    } catch (err) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: !isEmpty(err) ? err : err.message,
        },
        HttpStatus.FORBIDDEN,
      );
    }
  }

  /**
   * Update order
   * @param id
   * @param updateOrderDto
   */
  async update(
    id: string,
    updateOrderDto: UpdateOrderDto,
  ): Promise<OrderAttributes> {
    try {
      const orderExist: OrderAttributes = await this.findOne(id);
      if (!orderExist) {
        throw {
          message: OrderErrors.ORDER_NOT_FOUND,
          errorCode: OrderErrorCodes.ORDER_NOT_FOUND,
        };
      }
      /**
       * Update order
       */
      // orderExist.name = updateOrderDto.name;
      if (updateOrderDto.active) orderExist.active = updateOrderDto.active;
      const orderUpdated = await this.orderModel
        .findByIdAndUpdate({ _id: id }, { $set: updateOrderDto }, { new: true })
        .lean()
        .exec();
      return orderUpdated;
    } catch (err) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: !isEmpty(err) ? err : err.message,
        },
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async remove(id: string): Promise<OrderAttributes> {
    try {
      const orderExist = await this.findOne(id);
      if (!orderExist) {
        throw {
          message: OrderErrors.ORDER_NOT_FOUND,
          errorCode: OrderErrorCodes.ORDER_NOT_FOUND,
        };
      }
      orderExist._deleted = true;
      orderExist._deletedAt = new Date();
      const orderDelete = await this.orderModel
        .findByIdAndUpdate({ _id: id }, { $set: orderExist }, { new: true })
        .select('_id _deleted _deletedAt name')
        .lean()
        .exec();
      return orderDelete;
    } catch (err) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: !isEmpty(err) ? err : err.message,
        },
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
