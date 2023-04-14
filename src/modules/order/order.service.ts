import OrderAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/order/order.entity';
import Order, { OrderDocument, OrderModelExt } from '@albatrosdeveloper/ave-models-npm/lib/schemas/order/order.schema';
import { OrderErrors, OrderErrorCodes } from '@albatrosdeveloper/ave-models-npm/lib/schemas/order/order.errors';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto, UpdatePaymentSessionIdDto } from './dto/update-order.dto';
import { get, isEmpty, pick, size } from 'lodash';
import { LeanDocument } from 'mongoose';
import {
  andAllWhere,
  buildQuery,
  CombinedFilter,
  Normalizers,
  Ops,
  seed,
  select,
  where,
} from '@albatrosdeveloper/ave-utils-npm/lib/utils/query.util';
import { DocumentWithCountInterface, PatchBulkInterface } from '@albatrosdeveloper/ave-models-npm/lib/methods/common/interfaces/interfaces';
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
import { OrderDetailService } from '../order-detail/order-detail.service';
import { ConfigService } from '@nestjs/config';
import UserAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/user/user.entity';
import SuperUserAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/superUser/superUser.entity';
import { UserErrorCodes, UserErrors } from '@albatrosdeveloper/ave-models-npm/lib/schemas/user/user.errors';
import * as PromiseB from 'bluebird';
import { OrderServiceUtil } from '../../utils/order/orderUtil.service';
import { OrderCodeTypeEnum, ValidationTypeEnum } from '../../utils/orderType/orderType';
import { SendOrderToCourierDto } from './dto/send-to-courier.dto';
import { sendOrdersToCourier } from 'src/utils/delivery/delivery';
import { updateBulkActions } from '@albatrosdeveloper/ave-models-npm/lib/methods/common/enums/enums';
import { UpdateStatusCourierDto } from './dto/update-status-courier.dto';
import { AttributeItemAttributes } from '@albatrosdeveloper/ave-models-npm/lib/schemas/item/item.entity';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cleanDeep = require('clean-deep');

const RESPONSE_VALIDATE_ORDERS_FIELDS = ['errors', 'error', 'id', 'orderDetails', 'couriers'];

export interface OrderResponseToCourier {
  orderCode: string,
  response: string,
  errorMessage: string,
}

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly orderServiceUtil: OrderServiceUtil,
    @InjectModel(Order.name)
    private readonly orderModel: OrderModelExt<OrderDocument>,
    private readonly httpService: HttpService,
    private orderDetailService: OrderDetailService,
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
    parentCode: string,
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
      parentCode: parentCode,
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
    if (!orderNew.parentCode) {
      await this.update(orderNew._id, { parentCode: orderNew.code });
      orderNew.parentCode = orderNew.code;
    }

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

      let parentCode: string = null;
      for (const orderAttribute of createOrderDto) {
        const orderNew = await this.createOrder(
          orderAttribute,
          {
            user,
            token,
          },
          parentCode,
        );

        if (!parentCode) parentCode = orderNew.parentCode;

        const result = {
          id: orderAttribute.id,
          error: false,
          errors: [],
          curiers: [],
          orderDetaills: orderNew.orderDetaills,
          orderId: orderNew._id.toString(),
          orderCode: orderNew.code,
          parentCode: parentCode,
        };
        results.push(result);
      }
      return results;
    } catch (err) {
      throw get(err, 'status')
        ? err
        : new HttpException(
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
          if ((!isEmpty(user) || !isEmpty(order?.user)) && type === ValidationTypeEnum.PRE_CREATE) {
            checkUser = await this.orderServiceUtil.userValidation(!isEmpty(user) ? user : order.user, order?.userAddress);
          } else if (type === ValidationTypeEnum.CREATE) {
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
            ...(/*order.errors ?? */[]),
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
      throw get(err, 'status')
        ? err
        : new HttpException(
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
      throw get(err, 'status')
        ? err
        : new HttpException(
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
      throw get(err, 'status')
        ? err
        : new HttpException(
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
      throw get(err, 'status')
        ? err
        : new HttpException(
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
      throw get(err, 'status')
        ? err
        : new HttpException(
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
      throw get(err, 'status')
        ? err
        : new HttpException(
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
      throw get(err, 'status')
        ? err
        : new HttpException(
            {
              status: HttpStatus.FORBIDDEN,
              error: !isEmpty(err) ? err : err.message,
            },
            HttpStatus.FORBIDDEN,
          );
    }
  }

  /**
   * Guarda el sessionId de los pedidos que tengan un parentCode especìfico
   * @param updatePaymentSessionIdDto
   */
  async updatePaymentSessionId(updatePaymentSessionIdDto: UpdatePaymentSessionIdDto): Promise<any> {
    try {
      const flagRTN = updatePaymentSessionIdDto.flagRTN == true
      let dataToUpdate: Partial<OrderAttributes> = {
        paymentSessionId: updatePaymentSessionIdDto.paymentSessionId, 
      }

      if(flagRTN) {
        dataToUpdate.flagRTN = flagRTN
        dataToUpdate.businessName = updatePaymentSessionIdDto.businessName
        dataToUpdate.RTN = updatePaymentSessionIdDto.RTN
      }

      return await this.orderModel.updateMany(
        { parentCode: updatePaymentSessionIdDto.parentCode },
        { $set: dataToUpdate },
      );
    } catch (err) {
      throw get(err, 'status')
        ? err
        : new HttpException(
            {
              status: HttpStatus.FORBIDDEN,
              error: !isEmpty(err) ? err : err.message,
            },
            HttpStatus.FORBIDDEN,
          );
    }
  }

  async sendOrdersToCourier(sendOrderToCourierDto: SendOrderToCourierDto): Promise<any> {
    let orders: OrderAttributes[] = [];
    const prepareQueryOrders = buildQuery<OrderAttributes>(
      where('_id', Ops.in(...sendOrderToCourierDto.orderIds, Normalizers.ObjectId)),
      select(['_id', 'code', 'status', 'deliveryPrice', 'user', 'userAddress', 'orderType', 'businessPartner', 'warehouse', 'orderDetails', 'courier']),
    );

    orders = await this.findAll(prepareQueryOrders);

    // Valida uno a uno que los pedidos existan
    for (const id of sendOrderToCourierDto.orderIds) {
      if (!orders.some((o) => String(o._id) == id))
        throw {
          message: OrderErrors.ORDER_NOT_FOUND,
          errorCode: OrderErrorCodes.ORDER_NOT_FOUND,
        };
    }

    // Validación de status
    // Aqui sólo se debería validar el primero
    for (const order of orders) {
      if (order.status < 4)
        throw {
          message: 'El pedido aún no ha sido pagado',
        };
      if (order.status == 6)
        throw {
          message: 'El pedido ya ha sido asignado a un courier',
        };
      if (order.status == 7)
        throw {
          message: 'El pedido ya fue entregado',
        };
    }

    const body = [];
    let orderPosition = 1;
    for (const order of orders) {
      if (order.orderType.code == OrderCodeTypeEnum.DELIVERY) {
        let orderDetails: any[] = [];
        for (const orderDetail of order.orderDetails) {
          let variantText = ""
          if(orderDetail.variant && orderDetail.variant.atributes) {
            const attributes: AttributeItemAttributes[] = orderDetail.variant.atributes

            if(attributes.length > 0) 
              for(const attribute of attributes) {
                if(variantText != "")
                  variantText = variantText + `, `
                variantText = variantText + `${attribute.attribute.name}: ${attribute.value}`
              }
          }

          orderDetails.push({
            SKU: orderDetail.item.SKU,
            name: orderDetail.item.name,
            variant: variantText,
            quantity: orderDetail.quantity,
            packaging: orderDetail.item.packaging,
          });
        }

        body.push({
          id: orderPosition,
          orderCode: order?.code,
          origin: {
            country: order?.warehouse?.address?.country,
            locationOne: order?.warehouse?.address?.locationOne,
            locationTwo: order.warehouse?.address?.locationTwo,
            locationThree: order.warehouse?.address?.locationThree,
            address: order.warehouse?.address?.address,
            reference: order?.warehouse?.address?.reference,
            latitude: order?.warehouse?.address?.latitude,
            longitude: order?.warehouse?.address?.longitud,
            business: {
              email: order?.businessPartner?.emailOfficial,
              name: order?.warehouse?.name,
              phone: order?.warehouse?.phone,
            },
          },
          destiny: {
            country: order?.userAddress?.country,
            locationOne: order?.userAddress?.locationOne,
            locationTwo: order?.userAddress?.locationTwo,
            locationThree: order?.userAddress?.locationThree,
            address: order?.userAddress?.address,
            reference: order?.userAddress?.reference,
            latitude: order?.userAddress?.latitude,
            longitude: order?.userAddress?.longitud,
            customer: {
              email: order?.user.userLogin.email,
              name: order?.user.userLogin.firstName + ' ' + order?.user.userLogin.lastName,
              phone: order?.user.userLogin.phoneNumber,
            },
          },
          courier: {
            id: order?.courier.id,
            name: order?.courier.name,
            price: order?.deliveryPrice,
          },
          detail: orderDetails,
        });
      }
      orderPosition++;
    }

    if (body.length > 0) {
      const responseCourier = await sendOrdersToCourier(body);
      const dataToUpdate: OrderAttributes[] = [];
      if (responseCourier && responseCourier.response != 'error') {
        for (const orderCourier of responseCourier.data.filter(oc => oc.response == 'success')) {
          const orderFound = orders.find((o) => o.code == orderCourier.orderCode);

          if (orderFound)
            dataToUpdate.push({
              ...orderFound,
              subStatus: 1, // Pendiente
              courierData: orderCourier.data,
            });
        }
      } else {
        throw {
          message: 'Error al enviar el pedido al courier',
        };
      }

      if (dataToUpdate.length > 0) 
        await this.updateStatusAndCourier(dataToUpdate);
    } else {
      throw {
        message: 'No hay pedidos para enviar al courier',
      };
    }

    return {
      response: 'success',
    };
  }

  async updateStatusAndCourier(data: OrderAttributes[]): Promise<any> {
    const createUpdateOrdersBulk: PatchBulkInterface[] = data.map((order) => ({
      action: updateBulkActions.arrayFilters,
      filters: { _id: order._id },
      fields: {
        status: order.subStatus != 4 ? 6 : 7, // 6: en delivery, 7: pedido entregado
        subStatus: order.subStatus,
        courierData: order.courierData,
      },
    }));
    return await this.orderModel.patchDocumentsBulk(createUpdateOrdersBulk);
  }

  /**
   * Actuaiza el subStatus del pedido
   * Este servicio lo consume el servidor de courier
   * @param updateStatusCourierDto
   */
  async updateStatusCourier(updateStatusCourierDto: UpdateStatusCourierDto[]): Promise<OrderResponseToCourier[]> {
    let orders: OrderAttributes[] = [];
    const prepareQueryOrders = buildQuery<OrderAttributes>(
      where('code', Ops.in(...updateStatusCourierDto.map(o => o.orderCode))),
      select(['_id', 'code', 'status', 'courierData']),
    );

    orders = await this.findAll(prepareQueryOrders);
    const dataToUpdate: OrderAttributes[] = [];
    let response: OrderResponseToCourier[] = []

    // Valida uno a uno que los pedidos existan
    for (const courierData of updateStatusCourierDto) {
      let orderResponse = {
        orderCode: courierData.orderCode,
        response: 'success',
        errorMessage: '',
      }

      const orderFound = orders.find((o) => o.code == courierData.orderCode);

      if (orderFound) {
        dataToUpdate.push({
          ...orderFound,
          subStatus: courierData.status,
        });
      } else {
        orderResponse.response = 'error'
        orderResponse.errorMessage = OrderErrors.ORDER_NOT_FOUND
      }
      response.push(orderResponse)
    }

    if (dataToUpdate.length > 0)
      try {
        await this.updateStatusAndCourier(dataToUpdate);
      } catch (error) {
        response.forEach(r => {
          const orderWithError = dataToUpdate.some(o => o.code == r.orderCode)
          if(orderWithError) {
            r.response = 'error'
            r.errorMessage = 'No se actualizó el estado del pedido'
          }
        })
      }
      
    return response
  }
}
