import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateOrderLogDto } from './dto/create-order-log.dto';
import { UpdateOrderLogDto } from './dto/update-order-log.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import OrderLog, { OrderLogDocument } from '../../database/models/orderLogs/orderLog.schema';
import { isEmpty } from 'lodash';
import * as moment from 'moment-timezone';
import { StoreLogService } from '../store-log/store-log.service';
import { OrderLogAttributes } from '../../database/models/orderLogs/orderLog.attributes';
import { StoreLogAttributes } from '../../database/models/storeLog/storeLog.attributes';

@Injectable()
export class OrderLogService {
  constructor(
    @InjectModel(OrderLog.name) private readonly orderLogModel: Model<OrderLogDocument>,
    private readonly storeLogService: StoreLogService,
  ) {}
  create(createOrderLogDto: CreateOrderLogDto) {
    try {
      const today = moment().tz('America/Tegucigalpa').format('YYYY-MM-DD');
      const hour = moment().tz('America/Tegucigalpa').format('HH:mm:ss');
      createOrderLogDto.serverdate = today;
      createOrderLogDto.servertime = hour;
      createOrderLogDto.serverDateToDate = moment.tz(today, 'America/Tegucigalpa').toDate();
      return this.orderLogModel.create(createOrderLogDto);
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

  // query userid y retornar los ultimos 10 registros

  async set_monitor(data: CreateOrderLogDto & StoreLogAttributes): Promise<Record<string, any> | void> {
    try {
      const today = moment().tz('America/Tegucigalpa').format('YYYY-MM-DD');
      const hour = moment().tz('America/Tegucigalpa').format('HH:mm:ss');
      data.serverdate = today;
      data.servertime = hour;
      data.monitortime = hour;
      data.serverDateToDate = moment.tz(today, 'America/Tegucigalpa').toDate();
      const orderLogData: any = await this.orderLogModel.findOne({ ordernumber: data.ordernumber }).read('secondaryPreferred').lean().exec();
      data.attempt = orderLogData.attempt + 1;
      if (!orderLogData) {
        throw {
          response: 'order not found',
        };
      }
      if (orderLogData) {
        await this.storeLogService.storeLogModel.create({
          store: data.store,
          devicename: data.devicename,
          registertime: hour,
          ordernumber: data.ordernumber,
          registerdate: today,
          serverDateToDate: moment.tz(today, 'America/Tegucigalpa').toDate(),
        });
      }
      if (orderLogData && !orderLogData.monitortime) {
        await this.orderLogModel.updateOne({ ordernumber: data.ordernumber }, { $set: data }).lean().exec();
      }
      return {
        data: 'Insertado Exitosamente.',
        response: 'success',
      };
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

  async get_pending(): Promise<Record<string, any> | void> {
    try {
      const today = moment().format('YYYY-MM-DD');
      return this.orderLogModel
        .find({ serverdate: today, attempt: { $lt: 10 }, monitortime: { $eq: null } })
        .read('secondaryPreferred')
        .lean()
        .exec();
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

  async update_attempt_log(data: OrderLogAttributes): Promise<Record<string, any> | void> {
    try {
      return this.orderLogModel
        .findOneAndUpdate(
          { ordernumber: data.ordernumber },
          {
            $inc: {
              attempt: 1,
            },
          },
          { new: true },
        )
        .lean()
        .exec();
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
