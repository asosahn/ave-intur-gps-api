import OrderDetaillTemporalAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/orderDetaillTemporal/orderDetaillTemporal.entity';
import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrderDetaillTemporalService } from './order-detaill-temporal.service';
import { CreateOrderDetaillTemporalDto } from './dto/create-order-detaill-temporal.dto';

@ApiTags('order-detaill-temporal')
@Controller('order-detaill-temporal')
export class OrderDetaillTemporalController {
  constructor(
    private readonly orderDetaillTemporalService: OrderDetaillTemporalService,
  ) {}

  @Post()
  async create(
    @Body() createOrderDetaillTemporalDto: CreateOrderDetaillTemporalDto,
  ): Promise<OrderDetaillTemporalAttributes> {
    return await this.orderDetaillTemporalService.create(
      createOrderDetaillTemporalDto,
    );
  }
}
