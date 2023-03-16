import OrderDetaillTemporalAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/orderDetaillTemporal/orderDetaillTemporal.entity';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateOrderDetaillTemporalDto } from './dto/create-order-detaill-temporal.dto';
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
export class OrderDetaillTemporalService {
  private readonly logger = new Logger(OrderDetaillTemporalService.name);
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
    createOrderDetaillTemporalDto: CreateOrderDetaillTemporalDto,
  ): Promise<OrderDetaillTemporalAttributes> {
    try {
      const typeAccountExist = await this.httpServiceGet<TypeAccountAtributes>(
        `${process.env.API_MASTER_URL}/type-account/byId/${createOrderDetaillTemporalDto.typeAccountId}`,
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
      const orderDetaillTemporalCreate = new OrderDetaillTemporalAttributes();
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
