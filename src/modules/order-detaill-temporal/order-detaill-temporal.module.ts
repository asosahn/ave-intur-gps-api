import { Module } from '@nestjs/common';
import { OrderDetaillTemporalService } from './order-detaill-temporal.service';
import { OrderDetaillTemporalController } from './order-detaill-temporal.controller';

@Module({
  controllers: [OrderDetaillTemporalController],
  providers: [OrderDetaillTemporalService]
})
export class OrderDetaillTemporalModule {}
