import OrderDetailTemporalAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/orderDetailTemporal/orderDetailTemporal.entity';
import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrderDetailTemporalService } from './order-detail-temporal.service';
import { CreateOrderDetailTemporalDto } from './dto/create-order-detail-temporal.dto';

@ApiTags('order-detail-temporal')
@Controller('order-detail-temporal')
export class OrderDetailTemporalController {
  constructor(
    private readonly orderDetailTemporalService: OrderDetailTemporalService,
  ) {}

  @Post()
  async create(
    @Body() createOrderDetailTemporalDto: CreateOrderDetailTemporalDto,
  ): Promise<OrderDetailTemporalAttributes> {
    return await this.orderDetailTemporalService.create(
      createOrderDetailTemporalDto,
    );
  }
}
