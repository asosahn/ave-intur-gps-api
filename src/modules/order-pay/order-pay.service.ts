import OrderPayAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/orderPay/orderPay.entity';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateOrderPayDto } from './dto/create-order-pay.dto';
import { isEmpty } from 'lodash';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import TypeCardAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/typeCard/typeCard.entity';
import { TypeCardErrors, TypeCardErrorCodes } from '@albatrosdeveloper/ave-models-npm/lib/schemas/typeCard/typeCard.errors';

@Injectable()
export class OrderPayService {
  private readonly logger = new Logger(OrderPayService.name);
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
    createOrderPayDto: CreateOrderPayDto,
  ): Promise<OrderPayAttributes> {
    try {
      const typeCard = await this.httpServiceGet<TypeCardAttributes>(
        `${process.env.API_MASTER_URL}/type-card/byId/${createOrderPayDto.typeCardId}`,
        undefined,
        {
          message: TypeCardErrors.TYPE_CARD_NOT_FOUND,
          errorCode: TypeCardErrorCodes.TYPE_CARD_NOT_FOUND,
        },
      );

      const orderPayCreate = new OrderPayAttributes();
      orderPayCreate.methodPayment = createOrderPayDto.methodPayment
      orderPayCreate.accountPayment = createOrderPayDto.accountPayment
      orderPayCreate.operationNumber = createOrderPayDto.operationNumber
      orderPayCreate.document = createOrderPayDto.document
      orderPayCreate.commentError = createOrderPayDto.commentError
      orderPayCreate.typeCard = typeCard
      orderPayCreate.active = createOrderPayDto.active

      return orderPayCreate;
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
