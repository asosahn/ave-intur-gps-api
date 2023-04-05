import OrderAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/order/order.entity';
import Order, { OrderDocument, OrderModelExt } from '@albatrosdeveloper/ave-models-npm/lib/schemas/order/order.schema';
import { OrderErrors, OrderErrorCodes } from '@albatrosdeveloper/ave-models-npm/lib/schemas/order/order.errors';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { isEmpty, pick, size } from 'lodash';
import { LeanDocument } from 'mongoose';
import { andAllWhere, buildQuery, CombinedFilter, Normalizers, Ops, seed, where } from '@albatrosdeveloper/ave-utils-npm/lib/utils/query.util';
import { DocumentWithCountInterface } from '@albatrosdeveloper/ave-models-npm/lib/methods/common/interfaces/interfaces';
import { catchError, firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import OrderTypeAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/orderType/orderType.entity';
import { OrderTypeErrors, OrderTypeErrorCodes } from '@albatrosdeveloper/ave-models-npm/lib/schemas/orderType/orderType.errors';
import BusinessPartnerAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/businessPartner/businessPartner.entity';
import {
  BusinessPartnerErrors,
  BusinessPartnerErrorCodes,
} from '@albatrosdeveloper/ave-models-npm/lib/schemas/businessPartner/businessPartner.errors';
import WarehouseAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/warehouse/warehouse.entity';
import { WarehouseErrors, WarehouseErrorCodes } from '@albatrosdeveloper/ave-models-npm/lib/schemas/warehouse/warehouse.errors';
import { OrderDetailTemporalService } from '../order-detail-temporal/order-detail-temporal.service';
import { OrderDetailService } from '../order-detail/order-detail.service';
import { OrderPayService } from '../order-pay/order-pay.service';
import { OrderLogService } from '../order-log/order-log.service';
import { ConfigService } from '@nestjs/config';
import UserAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/user/user.entity';
import SuperUserAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/superUser/superUser.entity';
import { UserErrorCodes, UserErrors } from '@albatrosdeveloper/ave-models-npm/lib/schemas/user/user.errors';
import * as PromiseB from 'bluebird';
import { OrderServiceUtil } from '../../utils/order/orderUtil.service';
import { ValidationTypeEnum } from '../../utils/orderType/orderType';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cleanDeep = require('clean-deep');

const RESPONSE_VALIDATE_ORDERS_FIELDS = ['errors', 'error', 'id', 'orderDetails', 'couriers'];

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly orderServiceUtil: OrderServiceUtil,
    @InjectModel(Order.name)
    private readonly orderModel: OrderModelExt<OrderDocument>,
    private readonly httpService: HttpService,
    private orderDetailTemporalService: OrderDetailTemporalService,
    private orderDetailService: OrderDetailService,
    private orderPayService: OrderPayService,
    private orderLogService: OrderLogService,
    private configService: ConfigService,
  ) {}

  async httpServiceGet<T>(api: string, filter: any, errorType: object): Promise<T> {
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

  async verifyUser(user: Partial<UserAttributes>): Promise<Record<string, any>> {
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
    const userPromise = this.httpServiceGet<UserAttributes>(`${this.configService.get('API_CLIENT_URL')}/user/byId/${userPayload._id}`, undefined, {
      message: UserErrors.USER_NOT_FOUND,
      errorCode: UserErrorCodes.USER_NOT_FOUND,
    });
    const OrderTypePromise = this.httpServiceGet<OrderTypeAttributes>(
      `${this.configService.get('API_MASTER_URL')}/order-type/byId/${createOrderDto.orderTypeId || createOrderDto.orderType._id}`,
      undefined,
      {
        message: OrderTypeErrors.ORDER_TYPE_NOT_FOUND,
        errorCode: OrderTypeErrorCodes.ORDER_TYPE_NOT_FOUND,
      },
    );
    const businessPartnerPromise = this.httpServiceGet<BusinessPartnerAttributes>(
      `${process.env.API_CLIENT_URL}/business-partner/byId/${createOrderDto.businessPartnerId || createOrderDto.businessPartner._id}`,
      undefined,
      {
        message: BusinessPartnerErrors.BUSINESS_PARTNER_NOT_FOUND,
        errorCode: BusinessPartnerErrorCodes.BUSINESS_PARTNER_NOT_FOUND,
      },
    );
    const warehousePromise = this.httpServiceGet<WarehouseAttributes>(
      `${process.env.API_WAREHOUSE_URL}/warehouse/byId/${createOrderDto.warehouseId || createOrderDto.warehouse._id}`,
      undefined,
      {
        message: WarehouseErrors.WAREHOUSE_NOT_FOUND,
        errorCode: WarehouseErrorCodes.WAREHOUSE_NOT_FOUND,
      },
    );
    const [ordertype, businessPartner, warehouse, userData] = await Promise.all([
      OrderTypePromise,
      businessPartnerPromise,
      warehousePromise,
      userPromise,
    ]);
    if (!user || !userData?.active) {
      throw {
        message: UserErrors.USER_NOT_FOUND,
        errorCode: UserErrorCodes.USER_NOT_FOUND,
      };
    }
    const date = new Date(createOrderDto.deliveryDate);
    const newOrder = new this.orderModel({
      code: createOrderDto.code,
      user: userData,
      userAddress: createOrderDto.userAddress,
      total: createOrderDto.total,
      tax: createOrderDto.tax,
      discount: createOrderDto.discount,
      deliveryPrice: createOrderDto.deliveryPrice,
      status: createOrderDto.status || '1',
      orderType: ordertype,
      flagRTN: createOrderDto.flagRTN,
      RTN: createOrderDto.RTN,
      deliveryDate: createOrderDto.deliveryDate ? date : Date.now(),
      originType: createOrderDto.originType,
      newTotal: createOrderDto.newTotal,
      isProgrammed: createOrderDto.isProgrammed || false,
      programmedDate: createOrderDto.programmedDate ? new Date(createOrderDto.programmedDate) : null,
      businessPartner: businessPartner,
      warehouse: warehouse,
      courier: createOrderDto.courier,
      deliveryTax: createOrderDto.deliveryTax,
    });
    if (createOrderDto.orderDetails) {
      const orderDetails = [];
      for (const orderDetail of createOrderDto.orderDetails) {
        const orderDetailExist = await this.orderDetailService.create(orderDetail);
        orderDetails.push(orderDetailExist);
      }
      newOrder.orderDetails = orderDetails;
    }
    const orderNew = await this.orderModel.createGenId(newOrder);
    return orderNew;
  }

  async create(
    createOrderDto: CreateOrderDto[] | any,
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
      const validateOrder: Array<Record<string, any>> | any = await this.validateOrder(createOrderDto, { user, token }, ValidationTypeEnum.CREATE);
      const findErrors = validateOrder.some((order) => order.error);
      if (findErrors) {
        return validateOrder;
      }
      for (const orderAttribute of createOrderDto) {
        const orderNew = await this.createOrder(orderAttribute, {
          user,
          token,
        });
        const result = {
          id: orderAttribute.id,
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
    { user, token }: { user: UserAttributes | Partial<UserAttributes>; token?: string },
    type = ValidationTypeEnum.PRE_CREATE,
  ): Promise<OrderAttributes | void> {
    try {
      const ordersValidated = await PromiseB.map(
        orders,
        async (order) => {
          let checkUser;
          if (user || order.user) {
            checkUser = await this.orderServiceUtil.userValidation(!isEmpty(user) ? user : order.user, order?.userAddress);
          }
          let businessPartnerValidation;
          const businessPartner = await this.orderServiceUtil.getBusinessPartnerWithOrderData(order);
          !businessPartner &&
            (businessPartnerValidation = {
              error: true,
              message: BusinessPartnerErrors.BUSINESS_PARTNER_NOT_FOUND,
              errorCode: BusinessPartnerErrorCodes.BUSINESS_PARTNER_NOT_FOUND,
            });
          const warehouse = await this.orderServiceUtil.getWarehouseWithOrderData(order);
          order.warehouse = warehouse;
          const validationWarehouse = this.orderServiceUtil.validateWarehouse(order);
          const { validation: validationOrderType, couriers, couriersValidation } = await this.orderServiceUtil.checkOrderType(order, type);
          order.couriers = couriers ?? [];
          // const validateLocationWarehouse = await this.orderServiceUtil.validateLocationWarehouse(order);
          const validateOrdersDetailsGeneral = await this.orderServiceUtil.validateStock(order);
          order.errors = cleanDeep([
            ...(order.errors ?? []),
            validationOrderType,
            validationWarehouse,
            // validateLocationWarehouse,
            checkUser,
            businessPartnerValidation,
            validateOrdersDetailsGeneral,
            couriersValidation,
          ]);
          order.error = size(order.errors) > 0;
          const preOrder = pick(order, RESPONSE_VALIDATE_ORDERS_FIELDS);
          return cleanDeep({
            ...preOrder,
            orderDetails: preOrder.orderDetails.map((det) => pick(det, ['itemId', 'quantity', 'availableStock', 'error', 'errors', 'id'])),
          });
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
      const prepareQuery = buildQuery(seed(filter as CombinedFilter<OrderAttributes>), andAllWhere('_deleted', false));
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
      const prepareQuery = buildQuery(seed(filter as CombinedFilter<OrderAttributes>), andAllWhere('_deleted', false));
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
      const prepareQuery = buildQuery(seed(filter as CombinedFilter<OrderAttributes>), andAllWhere('_deleted', false));
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
      const prepareQuery = buildQuery<OrderAttributes>(where('_id', Ops.eq(id, Normalizers.ObjectId)), andAllWhere('_deleted', false));
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
  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<OrderAttributes> {
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
      const orderUpdated = await this.orderModel.findByIdAndUpdate({ _id: id }, { $set: updateOrderDto }, { new: true }).lean().exec();
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
