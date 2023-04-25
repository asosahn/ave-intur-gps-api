import { PartialType } from '@nestjs/swagger';
import { CreateOrderLogDto } from './create-order-log.dto';

export class UpdateOrderLogDto extends PartialType(CreateOrderLogDto) {}
