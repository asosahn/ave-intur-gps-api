import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OrderLogService } from './order-log.service';
import { CreateOrderLogDto } from './dto/create-order-log.dto';
import { OrderLogAttributes } from '../../database/models/orderLogs/orderLog.attributes';
import { StoreLogAttributes } from '../../database/models/storeLog/storeLog.attributes';

@Controller('order_log')
export class OrderLogController {
  constructor(private readonly orderLogService: OrderLogService) {}

  @Post('set_server')
  async create(@Body() createOrderLogDto: CreateOrderLogDto) {
    return this.orderLogService.create(createOrderLogDto);
  }

  @Post('set_monitor')
  async set_monitor(@Body() data: CreateOrderLogDto & StoreLogAttributes): Promise<any> {
    return this.orderLogService.set_monitor(data);
  }

  @Post('update_attempt_log')
  async update_attempt_log(@Body() data: CreateOrderLogDto): Promise<any> {
    return this.orderLogService.update_attempt_log(data);
  }

  @Get('get_pending')
  async get_pending(): Promise<any> {
    return this.orderLogService.get_pending();
  }
}
