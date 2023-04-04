import OrderDetailAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/orderDetail/orderDetail.entity';
import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrderDetailService } from './order-detail.service';
import { CreateOrderDetaillDto } from './dto/create-order-detail.dto';

@ApiTags('order-detail')
@Controller('order-detail')
export class OrderDetailController {
  constructor(private readonly orderDetailService: OrderDetailService) {}

  @Post()
  async create(
    @Body() createOrderDetailDto: CreateOrderDetaillDto,
  ): Promise<OrderDetailAttributes> {
    return await this.orderDetailService.create(createOrderDetailDto);
  }
}
