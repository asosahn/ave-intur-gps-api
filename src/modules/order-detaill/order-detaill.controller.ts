import OrderDetaillAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/orderDetaill/orderDetaill.entity';
import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrderDetaillService } from './order-detaill.service';
import { CreateOrderDetaillDto } from './dto/create-order-detaill.dto';

@ApiTags('order-detaill')
@Controller('order-detaill')
export class OrderDetaillController {
  constructor(private readonly orderDetaillService: OrderDetaillService) {}

  @Post()
  async create(
    @Body() createOrderDetaillDto: CreateOrderDetaillDto,
  ): Promise<OrderDetaillAttributes> {
    return await this.orderDetaillService.create(createOrderDetaillDto);
  }
}
