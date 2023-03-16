import OrderDetaillAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/orderDetaill/orderDetaill.entity';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateOrderDetaillDto } from './dto/create-order-detaill.dto';
import { isEmpty } from 'lodash';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import ItemAttributes, { AttributeItemAttributes } from '@albatrosdeveloper/ave-models-npm/lib/schemas/item/item.entity';
import { ItemErrors, ItemErrorCodes } from '@albatrosdeveloper/ave-models-npm/lib/schemas/item/item.errors';
import AttributeAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/attribute/attribute.entity';
import { AttributeErrors, AttributeErrorCodes } from '@albatrosdeveloper/ave-models-npm/lib/schemas/attribute/attribute.errors';

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
        `${process.env.API_ITEM_URL}/item/byId/${createOrderDetaillDto.itemId}`,
        undefined,
        {
          message: ItemErrors.ITEM_NOT_FOUND,
          errorCode: ItemErrorCodes.ITEM_NOT_FOUND,
        },
      );

      const attribute = await this.httpServiceGet<AttributeAttributes>(
        `${process.env.API_MASTER_URL}/attribute/byId/${createOrderDetaillDto.attributeItem.atributeId}`,
        undefined,
        {
          message: AttributeErrors.ATTRIBUTE_NOT_FOUND,
          errorCode: AttributeErrorCodes.ATTRIBUTE_NOT_FOUND,
        },
      );

      const attributeItem = new AttributeItemAttributes()
      attributeItem.attribute = attribute
      attributeItem.value = createOrderDetaillDto.attributeItem.value

      const orderDetaillCreate = new OrderDetaillAttributes();
      orderDetaillCreate.item = item
      orderDetaillCreate.attributeItem = attributeItem
      orderDetaillCreate.quantity = createOrderDetaillDto.quantity
      orderDetaillCreate.price = createOrderDetaillDto.price
      orderDetaillCreate.quantisubtotalty = createOrderDetaillDto.quantisubtotalty
      orderDetaillCreate.note = createOrderDetaillDto.note

      return orderDetaillCreate;
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
