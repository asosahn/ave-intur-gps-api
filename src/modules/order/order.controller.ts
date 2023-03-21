import { DocumentWithCountInterface } from '@albatrosdeveloper/ave-models-npm/lib/methods/common/interfaces/interfaces';
import OrderAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/order/order.entity';
import { filterQueryPipe } from '@albatrosdeveloper/ave-utils-npm/lib/utils/pipes/filterQuery.pipe';
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Request } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { LeanDocument } from 'mongoose';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { get } from 'lodash';

@ApiTags('order')
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async create(@Body() createOrderDto: CreateOrderDto & any, @Request() req: any): Promise<OrderAttributes> {
    const user = get(req, 'user.user', {});
    const token = get(req, 'headers.authorization', '');
    return await this.orderService.create(createOrderDto, { user, token });
  }

  @Post('validate')
  async validateOrder(@Body() createOrderDto: CreateOrderDto & any, @Request() req: any): Promise<OrderAttributes | void> {
    const user = get(req, 'user.user', {});
    const token = get(req, 'headers.authorization', '');
    return await this.orderService.validateOrder(createOrderDto, {
      user,
      token,
    });
  }

  @Get()
  @ApiQuery({
    name: 'filter',
    required: false,
    type: 'string',
    description: 'filter query',
  })
  async findAll(@Query('filter', new filterQueryPipe()) filter: Record<string, any>): Promise<LeanDocument<OrderAttributes>[]> {
    return await this.orderService.findAll(filter);
  }

  @Get('withCount')
  @ApiQuery({
    name: 'filter',
    required: false,
    type: 'string',
    description: 'filter query',
  })
  async findAllWithCount(@Query('filter', new filterQueryPipe()) filter: Record<string, any>): Promise<DocumentWithCountInterface> {
    return await this.orderService.findAllWithCount(filter);
  }

  @Get('byId/:id')
  async findOne(@Param('id') id: string): Promise<LeanDocument<OrderAttributes>> {
    return await this.orderService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto): Promise<LeanDocument<OrderAttributes>> {
    return await this.orderService.update(id, updateOrderDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<LeanDocument<OrderAttributes>> {
    return await this.orderService.remove(id);
  }

  @Get('count')
  @ApiQuery({
    name: 'filter',
    required: false,
    type: 'string',
    description: 'filter query',
  })
  async findAllCount(@Query('filter', new filterQueryPipe()) filter: Record<string, any>): Promise<number> {
    return await this.orderService.findAllCount(filter);
  }
}
