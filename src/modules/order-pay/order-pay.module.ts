import { Module } from '@nestjs/common';
import { OrderPayService } from './order-pay.service';
import { OrderPayController } from './order-pay.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [OrderPayController],
  providers: [OrderPayService],
  exports: [OrderPayService]
})
export class OrderPayModule { }
