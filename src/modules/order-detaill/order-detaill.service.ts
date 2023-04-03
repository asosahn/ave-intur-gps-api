import OrderDetaillAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/orderDetaill/orderDetaill.entity';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateOrderDetaillDto } from './dto/create-order-detaill.dto';
import { isEmpty } from 'lodash';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import ItemAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/item/item.entity';
import {
  ItemErrors,
  ItemErrorCodes,
} from '@albatrosdeveloper/ave-models-npm/lib/schemas/item/item.errors';
import { Types } from 'mongoose';

@Injectable()
export class OrderDetaillService {
  private readonly logger = new Logger(OrderDetaillService.name);
  constructor(private readonly httpService: HttpService) {}

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

  async create(
    createOrderDetaillDto: CreateOrderDetaillDto,
  ): Promise<OrderDetaillAttributes> {
    try {
      const item = await this.httpServiceGet<ItemAttributes>(
        `${process.env.API_ITEM_URL}/item/byId/${
          createOrderDetaillDto.item._id.toString() ||
          createOrderDetaillDto.itemId
        }`,
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
      const orderDetailCreate = new OrderDetaillAttributes();
      orderDetailCreate.item = item;
      orderDetailCreate.variant = createOrderDetaillDto.variant;
      orderDetailCreate.quantity = createOrderDetaillDto.quantity;
      orderDetailCreate.price = createOrderDetaillDto.price;
      orderDetailCreate.subtotal = createOrderDetaillDto.subtotal;
      orderDetailCreate.note = createOrderDetaillDto.note;
      orderDetailCreate._id = new Types.ObjectId();
      return orderDetailCreate;
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
