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
import { isEmpty, size } from 'lodash';
import { LeanDocument } from 'mongoose';
import {
  andAllWhere,
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
import { ConfigService } from '@nestjs/config';
import UserAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/user/user.entity';
import SuperUserAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/superUser/superUser.entity';
import {
  UserErrorCodes,
  UserErrors,
} from '@albatrosdeveloper/ave-models-npm/lib/schemas/user/user.errors';
import * as PromiseB from 'bluebird';
import { OrderServiceUtil } from '../../utils/order/orderUtil.service';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cleanDeep = require('clean-deep');

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly orderServiceUtil: OrderServiceUtil,
    @InjectModel(Order.name)
    private readonly orderModel: OrderModelExt<OrderDocument>,
    private readonly httpService: HttpService,
    private orderDetaillTemporalService: OrderDetaillTemporalService,
    private orderDetailService: OrderDetaillService,
    private orderPayService: OrderPayService,
    private orderLogService: OrderLogService,
    private configService: ConfigService,
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

  async verifyUser(
    user: Partial<UserAttributes>,
  ): Promise<Record<string, any>> {
    return this.orderServiceUtil.userValidation(user);
  }

  async createOrder(
    createOrderDto: CreateOrderDto,
    {
      user,
    }: {
      user: Partial<UserAttributes> | Partial<SuperUserAttributes>;
      token?: string;
    },
  ) {
    const userPayload = createOrderDto.user || user;
    const userPromise = this.httpServiceGet<UserAttributes>(
      `${this.configService.get('API_CLIENT_URL')}/user/byId/${
        userPayload._id
      }`,
      undefined,
      {
        message: UserErrors.USER_NOT_FOUND,
        errorCode: UserErrorCodes.USER_NOT_FOUND,
      },
    );
    const OrderTypePromise = this.httpServiceGet<OrderTypeAttributes>(
      `${this.configService.get('API_MASTER_URL')}/order-type/byId/${
        createOrderDto.orderTypeId || createOrderDto.orderType._id
      }`,
      undefined,
      {
        message: OrderTypeErrors.ORDER_TYPE_NOT_FOUND,
        errorCode: OrderTypeErrorCodes.ORDER_TYPE_NOT_FOUND,
      },
    );
    const businessPartnerPromise =
      this.httpServiceGet<BusinessPartnerAttributes>(
        `${process.env.API_CLIENT_URL}/business-partner/byId/${
          createOrderDto.businessPartnerId || createOrderDto.businessPartner._id
        }`,
        undefined,
        {
          message: BusinessPartnerErrors.BUSINESS_PARTNER_NOT_FOUND,
          errorCode: BusinessPartnerErrorCodes.BUSINESS_PARTNER_NOT_FOUND,
        },
      );
    const warehousePromise = this.httpServiceGet<WarehouseAttributes>(
      `${process.env.API_WAREHOUSE_URL}/warehouse/byId/${
        createOrderDto.warehouseId || createOrderDto.warehouse._id
      }`,
      undefined,
      {
        message: WarehouseErrors.WAREHOUSE_NOT_FOUND,
        errorCode: WarehouseErrorCodes.WAREHOUSE_NOT_FOUND,
      },
    );
    const [ordertype, businessPartner, warehouse, userData] = await Promise.all(
      [OrderTypePromise, businessPartnerPromise, warehousePromise, userPromise],
    );
    if (!user || !userData?.active) {
      throw {
        message: UserErrors.USER_NOT_FOUND,
        errorCode: UserErrorCodes.USER_NOT_FOUND,
      };
    }
    const date = new Date(createOrderDto.deliveryDate);
    const newOrder = new this.orderModel({
      code: createOrderDto.code,
      user: user,
      userAddress: createOrderDto.userAddress,
      total: createOrderDto.total,
      tax: createOrderDto.tax,
      discount: createOrderDto.discount,
      deliveryPrice: createOrderDto.deliveryPrice,
      status: createOrderDto.status || '1',
      orderType: ordertype,
      flagRTN: createOrderDto.flagRTN,
      RTN: createOrderDto.RTN,
      deliveryDate: date,
      originType: createOrderDto.originType,
      newTotal: createOrderDto.newTotal,
      businessPartner: businessPartner,
      warehouse: warehouse,
      courier: createOrderDto.courier,
      deliveryTax: createOrderDto.deliveryTax,
    });
    if (createOrderDto.orderDetaills) {
      const orderDetaills = [];
      for (const orderDetaill of createOrderDto.orderDetaills) {
        const orderDetailExist = await this.orderDetailService.create(
          orderDetaill,
        );
        orderDetaills.push(orderDetailExist);
      }
      newOrder.orderDetaills = orderDetaills;
    }
    const orderNew = await this.orderModel.createGenId(newOrder);
    return orderNew;
  }
  async create(
    createOrderDto: CreateOrderDto[],
    {
      user,
      token,
    }: {
      user: Partial<UserAttributes> | Partial<SuperUserAttributes>;
      token?: string;
    },
  ): Promise<OrderAttributes | any> {
    try {
      const results = [];
      for (const orderAttribute of createOrderDto) {
        const orderNew = await this.createOrder(orderAttribute, {
          user,
          token,
        });
        const result = {
          error: false,
          errors: [],
          curiers: [],
          orderDetaills: orderNew.orderDetaills,
          orderId: orderNew._id.toString(),
          orderCode: orderNew.code,
        };
        results.push(result);
      }
      return results;
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

  async validateOrder(
    orders: Partial<OrderAttributes> | CreateOrderDto,
    { user, token }: { user: UserAttributes; token?: string },
  ): Promise<OrderAttributes | void> {
    try {
      const ordersValidated = await PromiseB.map(
        orders,
        async (order) => {
          const checkUser = await this.orderServiceUtil.userValidation(
            !isEmpty(user) ? user : order.user,
          );
          const warehouse =
            await this.orderServiceUtil.getWarehouseWithOrderData(order);
          order.warehouse = warehouse;
          const validationWarehouse =
            this.orderServiceUtil.validateWarehouse(order);
          const validationOrderType =
            await this.orderServiceUtil.checkOrderType(order);
          const validateLocationWarehouse =
            await this.orderServiceUtil.validateLocationWarehouse(order);
          order.errors = cleanDeep([
            ...(order.errors ?? []),
            validationOrderType,
            validationWarehouse,
            validateLocationWarehouse,
            checkUser,
          ]);
          order.error = size(order.errors) > 0;
          await this.orderServiceUtil.validateStock(order);
          return cleanDeep(order);
        },
        { concurrency: 10 },
      );
      return ordersValidated;
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
