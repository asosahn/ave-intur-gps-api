import OrderPayAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/orderPay/orderPay.entity';
import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrderPayService } from './order-pay.service';
import { CreateOrderPayDto } from './dto/create-order-pay.dto';

@ApiTags('order-pay')
@Controller('order-pay')
export class OrderPayController {
  constructor(private readonly orderPayService: OrderPayService) {}

  @Post()
  async create(
    @Body() createOrderPayDto: CreateOrderPayDto,
  ): Promise<OrderPayAttributes> {
    return await this.orderPayService.create(createOrderPayDto);
  }
}
