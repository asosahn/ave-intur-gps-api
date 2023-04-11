import OrderAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/order/order.entity';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateOrderDto extends PartialType(OrderAttributes) {
  @ApiProperty({
    required: false,
  })
  @IsString()
  @IsOptional()
  parentCode?: string;

  @ApiProperty({
    required: false,
  })
  @IsString()
  @IsOptional()
  active?: string;
}

export class UpdatePaymentSessionIdDto {
  @ApiProperty({
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  parentCode: string;

  @ApiProperty({
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  paymentSessionId: string;
}
