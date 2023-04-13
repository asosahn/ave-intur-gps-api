import OrderDetailAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/orderDetail/orderDetail.entity';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateOrderDetaillDto } from './dto/create-order-detail.dto';
import { get, isEmpty } from 'lodash';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import ItemAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/item/item.entity';
import { ItemErrors, ItemErrorCodes } from '@albatrosdeveloper/ave-models-npm/lib/schemas/item/item.errors';
import { Types } from 'mongoose';

@Injectable()
export class OrderDetailService {
  private readonly logger = new Logger(OrderDetailService.name);
  constructor(private readonly httpService: HttpService) {}

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

  async create(createOrderDetailDto: CreateOrderDetaillDto): Promise<OrderDetailAttributes> {
    try {
      const item = await this.httpServiceGet<ItemAttributes>(
        `${process.env.API_ITEM_URL}/item/byId/${createOrderDetailDto.item._id.toString() || createOrderDetailDto.itemId}`,
        undefined,
        {
          message: ItemErrors.ITEM_NOT_FOUND,
          errorCode: ItemErrorCodes.ITEM_NOT_FOUND,
        },
      );
      if (item.active !== '1') {
        throw {
          message: ItemErrors.ITEM_NOT_FOUND,
          errorCode: ItemErrorCodes.ITEM_NOT_FOUND,
        };
      }
      const orderDetailCreate = new OrderDetailAttributes();
      orderDetailCreate.item = item;
      orderDetailCreate.variant = createOrderDetailDto.variant;
      orderDetailCreate.quantity = createOrderDetailDto.quantity;
      orderDetailCreate.price = createOrderDetailDto.price;
      orderDetailCreate.subtotal = createOrderDetailDto.subtotal;
      orderDetailCreate.note = createOrderDetailDto.note;
      orderDetailCreate._id = new Types.ObjectId();
      return orderDetailCreate;
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
}
