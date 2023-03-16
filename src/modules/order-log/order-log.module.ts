import { Module } from '@nestjs/common';
import { OrderLogService } from './order-log.service';
import { OrderLogController } from './order-log.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [OrderLogController],
  providers: [OrderLogService],
  exports: [OrderLogService]
})
export class OrderLogModule { }
