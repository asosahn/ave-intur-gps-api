import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { HttpModule } from '@nestjs/axios';
import { OrderDetailModule } from '../order-detail/order-detail.module';
import { OrderDetailTemporalModule } from '../order-detail-temporal/order-detail-temporal.module';
import { OrderPayModule } from '../order-pay/order-pay.module';
import { OrderLogModule } from '../order-log/order-log.module';
import { MongooseModule } from '@nestjs/mongoose';
import Order, { OrderSchema } from '@albatrosdeveloper/ave-models-npm/lib/schemas/order/order.schema';
import { UserModule } from '../../utils/user/user.module';
import { OrderModuleUtils } from '../../utils/order/orderUtil.module';
import { ItemModule } from '../../utils/item/item.module';

@Module({
  imports: [
    HttpModule,
    OrderDetailModule,
    OrderDetailTemporalModule,
    OrderPayModule,
    OrderLogModule,
    UserModule,
    OrderModuleUtils,
    ItemModule,
    MongooseModule.forFeature([
      {
        name: Order.name,
        schema: OrderSchema,
        collection: 'order',
      },
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
