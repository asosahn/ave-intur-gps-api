import OrderPayAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/orderPay/orderPay.entity';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateOrderPayDto } from './dto/create-order-pay.dto';
import { isEmpty } from 'lodash';
import TypeAccountAtributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/typeAccount/typeAccount.entity';
import {
  TypeAccountErrorCodes,
  TypeAccountErrors,
} from '@albatrosdeveloper/ave-models-npm/lib/schemas/typeAccount/typeAccount.errors';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class OrderPayService {
  private readonly logger = new Logger(OrderPayService.name);
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
    createOrderPayDto: CreateOrderPayDto,
  ): Promise<OrderPayAttributes> {
    try {
      const typeAccountExist = await this.httpServiceGet<TypeAccountAtributes>(
        `${process.env.API_MASTER_URL}/type-account/byId/${createOrderPayDto.typeAccountId}`,
        undefined,
        {
          message: TypeAccountErrors.TYPE_ACCOUNT_NOT_FOUND,
          errorCode: TypeAccountErrorCodes.TYPE_ACCOUNT_NOT_FOUND,
        },
      );
      if (!typeAccountExist) {
        throw {
          message: TypeAccountErrors.TYPE_ACCOUNT_NOT_FOUND,
          errorCode: TypeAccountErrorCodes.TYPE_ACCOUNT_NOT_FOUND,
        };
      }
      const orderPayCreate = new OrderPayAttributes();
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
