import OrderDetaillTemporalAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/orderDetaillTemporal/orderDetaillTemporal.entity';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateOrderDetaillTemporalDto } from './dto/create-order-detaill-temporal.dto';
import { isEmpty } from 'lodash';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import ItemAttributes, { AttributeItemAttributes } from '@albatrosdeveloper/ave-models-npm/lib/schemas/item/item.entity';
import { ItemErrors, ItemErrorCodes } from '@albatrosdeveloper/ave-models-npm/lib/schemas/item/item.errors';
import AttributeAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/attribute/attribute.entity';
import { AttributeErrors, AttributeErrorCodes } from '@albatrosdeveloper/ave-models-npm/lib/schemas/attribute/attribute.errors';

@Injectable()
export class OrderDetaillTemporalService {
  private readonly logger = new Logger(OrderDetaillTemporalService.name);
  constructor(private readonly httpService: HttpService) { }

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
    createOrderDetaillTemporalDto: CreateOrderDetaillTemporalDto,
  ): Promise<OrderDetaillTemporalAttributes> {
    try {
      const item = await this.httpServiceGet<ItemAttributes>(
        `${process.env.API_ITEM_URL}/item/byId/${createOrderDetaillTemporalDto.itemId}`,
        undefined,
        {
          message: ItemErrors.ITEM_NOT_FOUND,
          errorCode: ItemErrorCodes.ITEM_NOT_FOUND,
        },
      );
      const attribute = await this.httpServiceGet<AttributeAttributes>(
        `${process.env.API_MASTER_URL}/attribute/byId/${createOrderDetaillTemporalDto.attributeItem.atributeId}`,
        undefined,
        {
          message: AttributeErrors.ATTRIBUTE_NOT_FOUND,
          errorCode: AttributeErrorCodes.ATTRIBUTE_NOT_FOUND,
        },
      );

      const attributeItem = new AttributeItemAttributes()
      attributeItem.attribute = attribute
      attributeItem.value = createOrderDetaillTemporalDto.attributeItem.value

      const orderDetaillTemporalCreate = new OrderDetaillTemporalAttributes();
      orderDetaillTemporalCreate.item = item
      orderDetaillTemporalCreate.attributeItem = attributeItem
      orderDetaillTemporalCreate.quantity = createOrderDetaillTemporalDto.quantity
      orderDetaillTemporalCreate.status = createOrderDetaillTemporalDto.status
      orderDetaillTemporalCreate.active = createOrderDetaillTemporalDto.active

      return orderDetaillTemporalCreate;
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
