import OrderLogAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/orderLog/orderLog.entity';
import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrderLogService } from './order-log.service';
import { CreateOrderLogDto } from './dto/create-order-log.dto';

@ApiTags('order-log')
@Controller('order-log')
export class OrderLogController {
  constructor(private readonly orderLogService: OrderLogService) {}

  @Post()
  async create(
    @Body() createOrderLogDto: CreateOrderLogDto,
  ): Promise<OrderLogAttributes> {
    return await this.orderLogService.create(createOrderLogDto);
  }
}
