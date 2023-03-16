import OrderAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/order/order.entity';
import Order, {
  OrderDocument,
  OrderModelExt,
} from '@albatrosdeveloper/ave-models-npm/lib/schemas/order/order.schema';
import {
  OrderErrors,
  OrderErrorCodes,
} from '@albatrosdeveloper/ave-models-npm/lib/schemas/order/order.errors';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { isEmpty } from 'lodash';
import { LeanDocument } from 'mongoose';
import {
  andWhere,
  buildQuery,
  CombinedFilter,
  Normalizers,
  Ops,
  seed,
  where,
} from '@albatrosdeveloper/ave-utils-npm/lib/utils/query.util';
import { DocumentWithCountInterface } from '@albatrosdeveloper/ave-models-npm/lib/methods/common/interfaces/interfaces';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: OrderModelExt<OrderDocument>,
  ) {}
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
      const orderNew = await this.orderModel.createGenId(createOrderDto);
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
        where('_deleted', false),
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
        where('_deleted', false),
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
        where('_deleted', false),
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
        andWhere('_deleted', false),
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
      orderExist.name = updateOrderDto.name;
      if (updateOrderDto.active) orderExist.active = updateOrderDto.active;
      const orderUpdated = await this.orderModel
        .findByIdAndUpdate({ _id: id }, { $set: orderExist }, { new: true })
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
