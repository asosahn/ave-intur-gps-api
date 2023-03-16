import OrderAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/order/order.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateOrderDto extends OrderAttributes {
  @ApiProperty({
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}
