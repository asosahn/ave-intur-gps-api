import OrderAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/order/order.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateOrderDto extends OrderAttributes {
  @ApiProperty({
    required: false,
  })
  @IsString()
  @IsOptional()
  active: string;
}
