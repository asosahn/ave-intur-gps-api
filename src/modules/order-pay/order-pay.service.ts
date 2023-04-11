import OrderPayAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/orderPay/orderPay.entity';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateOrderPayDto } from './dto/create-order-pay.dto';
import { isEmpty } from 'lodash';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import TypeCardAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/typeCard/typeCard.entity';
import { TypeCardErrors, TypeCardErrorCodes } from '@albatrosdeveloper/ave-models-npm/lib/schemas/typeCard/typeCard.errors';
import MethodPaymentAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/methodPayment/methodPayment.entity';
import { MethodPaymentErrors, MethodPaymentErrorCodes } from '@albatrosdeveloper/ave-models-npm/lib/schemas/methodPayment/methodPayment.errors';
import AccountPaymentAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/accountPayment/accountPayment.entity';
import TypeAccountAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/typeAccount/typeAccount.entity';
import { TypeAccountErrors, TypeAccountErrorCodes } from '@albatrosdeveloper/ave-models-npm/lib/schemas/typeAccount/typeAccount.errors';
import BankAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/bank/bank.entity';
import { BankErrors, BankErrorCodes } from '@albatrosdeveloper/ave-models-npm/lib/schemas/bank/bank.errors';

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
    createOrderPayDto: CreateOrderPayDto & any,
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
      console.log(typeCard, 'TYPE CARD')

      const methodPayment = await this.httpServiceGet<MethodPaymentAttributes>(
        `${process.env.API_MASTER_URL}/method-payment/byId/${createOrderPayDto.methodPaymentId}`,
        undefined,
        {
          message: MethodPaymentErrors.METHOD_PAYMENT_NOT_FOUND,
          errorCode: MethodPaymentErrorCodes.METHOD_PAYMENT_NOT_FOUND,
        },
      );
      console.log(methodPayment, 'METHOD PAYMENT')

      const typeAccount = await this.httpServiceGet<TypeAccountAttributes>(
        `${process.env.API_MASTER_URL}/type-account/byId/${createOrderPayDto.accountPayment.typeAccountId}`,
        undefined,
        {
          message: TypeAccountErrors.TYPE_ACCOUNT_NOT_FOUND,
          errorCode: TypeAccountErrorCodes.TYPE_ACCOUNT_NOT_FOUND,
        },
      );
      console.log(typeAccount, 'TYPE ACCOUNT')

      const bank = await this.httpServiceGet<BankAttributes>(
        `${process.env.API_BANK_URL}/bank/byId/${createOrderPayDto.accountPayment.bankId}`,
        undefined,
        {
          message: BankErrors.BANK_NOT_FOUND,
          errorCode: BankErrorCodes.BANK_NOT_FOUND,
        },
      );
      console.log(bank, 'BANK')

      const accountPayment: any = new AccountPaymentAttributes()
      accountPayment.code = createOrderPayDto.accountPayment.code
      accountPayment.typeAccount = typeAccount
      accountPayment.bank = bank
      accountPayment.numberAccount = createOrderPayDto.accountPayment.numberAccount
      accountPayment.additionalInformation = createOrderPayDto.accountPayment.additionalInformation
      accountPayment.nameTitular = createOrderPayDto.accountPayment.nameTitular

      const orderPayCreate = new OrderPayAttributes();
      orderPayCreate.methodPayment = methodPayment
      orderPayCreate.accountPayment = accountPayment
      orderPayCreate.operationNumber = createOrderPayDto.operationNumber
      orderPayCreate.document = createOrderPayDto.document
      orderPayCreate.commentError = createOrderPayDto.commentError
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
