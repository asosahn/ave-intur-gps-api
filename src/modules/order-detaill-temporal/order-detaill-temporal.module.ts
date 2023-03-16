import { Module } from '@nestjs/common';
import { OrderDetaillTemporalService } from './order-detaill-temporal.service';
import { OrderDetaillTemporalController } from './order-detaill-temporal.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [OrderDetaillTemporalController],
  providers: [OrderDetaillTemporalService],
  exports: [OrderDetaillTemporalService]
})
export class OrderDetaillTemporalModule { }
