import OrderLogAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/orderLog/orderLog.entity';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateOrderLogDto } from './dto/create-order-log.dto';
import { isEmpty } from 'lodash';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class OrderLogService {
  private readonly logger = new Logger(OrderLogService.name);
  constructor(
    private readonly httpService: HttpService,
  ) { }

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
    createOrderLogDto: CreateOrderLogDto,
  ): Promise<OrderLogAttributes> {
    try {
      const orderLogCreate = new OrderLogAttributes();
      orderLogCreate.type = createOrderLogDto.type
      orderLogCreate.reason = createOrderLogDto.reason

      return orderLogCreate;
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
