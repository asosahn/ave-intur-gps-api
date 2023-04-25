import { Module } from '@nestjs/common';
import { OrderLogService } from './order-log.service';
import { OrderLogController } from './order-log.controller';
import { MongooseModule } from '@nestjs/mongoose';
import OrderLog, { OrderLogSchema } from '../../database/models/orderLogs/orderLog.schema';
import { StoreLogModule } from '../store-log/store-log.module';

@Module({
  imports: [
    StoreLogModule,
    MongooseModule.forFeature([
      {
        name: OrderLog.name,
        schema: OrderLogSchema,
        collection: 'order_log',
      },
    ]),
  ],
  controllers: [OrderLogController],
  providers: [OrderLogService],
})
export class OrderLogModule {}
