import OrderDetailTemporalAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/orderDetailTemporal/orderDetailTemporal.entity';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateOrderDetailTemporalDto } from './dto/create-order-detail-temporal.dto';
import { get, isEmpty } from 'lodash';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import ItemAttributes, { AttributeItemAttributes } from '@albatrosdeveloper/ave-models-npm/lib/schemas/item/item.entity';
import { ItemErrors, ItemErrorCodes } from '@albatrosdeveloper/ave-models-npm/lib/schemas/item/item.errors';
import AttributeAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/attribute/attribute.entity';
import { AttributeErrors, AttributeErrorCodes } from '@albatrosdeveloper/ave-models-npm/lib/schemas/attribute/attribute.errors';

@Injectable()
export class OrderDetailTemporalService {
  private readonly logger = new Logger(OrderDetailTemporalService.name);
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

  async create(createOrderDetailTemporalDto: CreateOrderDetailTemporalDto): Promise<OrderDetailTemporalAttributes> {
    try {
      const item = await this.httpServiceGet<ItemAttributes>(
        `${process.env.API_ITEM_URL}/item/byId/${createOrderDetailTemporalDto.itemId}`,
        undefined,
        {
          message: ItemErrors.ITEM_NOT_FOUND,
          errorCode: ItemErrorCodes.ITEM_NOT_FOUND,
        },
      );
      const attribute = await this.httpServiceGet<AttributeAttributes>(
        `${process.env.API_MASTER_URL}/attribute/byId/${createOrderDetailTemporalDto.attributeItem.atributeId}`,
        undefined,
        {
          message: AttributeErrors.ATTRIBUTE_NOT_FOUND,
          errorCode: AttributeErrorCodes.ATTRIBUTE_NOT_FOUND,
        },
      );

      const attributeItem = new AttributeItemAttributes();
      attributeItem.attribute = attribute;
      attributeItem.value = createOrderDetailTemporalDto.attributeItem.value;

      const orderDetaillTemporalCreate = new OrderDetailTemporalAttributes();
      orderDetaillTemporalCreate.item = item;
      orderDetaillTemporalCreate.attributeItem = attributeItem;
      orderDetaillTemporalCreate.quantity = createOrderDetailTemporalDto.quantity;
      orderDetaillTemporalCreate.status = createOrderDetailTemporalDto.status;
      orderDetaillTemporalCreate.active = createOrderDetailTemporalDto.active;

      return orderDetaillTemporalCreate;
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
