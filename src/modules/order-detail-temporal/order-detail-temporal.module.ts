import { Module } from '@nestjs/common';
import { OrderDetailTemporalService } from './order-detail-temporal.service';
import { OrderDetailTemporalController } from './order-detail-temporal.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [OrderDetailTemporalController],
  providers: [OrderDetailTemporalService],
  exports: [OrderDetailTemporalService]
})
export class OrderDetailTemporalModule { }
