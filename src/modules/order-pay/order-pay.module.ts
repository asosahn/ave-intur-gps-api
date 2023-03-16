import { Module } from '@nestjs/common';
import { OrderPayService } from './order-pay.service';
import { OrderPayController } from './order-pay.controller';

@Module({
  controllers: [OrderPayController],
  providers: [OrderPayService]
})
export class OrderPayModule {}
