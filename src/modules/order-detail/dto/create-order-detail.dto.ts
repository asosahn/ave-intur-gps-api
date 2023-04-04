import ItemAttributes, {
  VariantAttributes,
} from '@albatrosdeveloper/ave-models-npm/lib/schemas/item/item.entity';
import OrderDetailAttributes from '@albatrosdeveloper/ave-models-npm/lib/schemas/orderDetail/orderDetail.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateOrderDetaillDto extends OrderDetailAttributes {
  @ApiProperty()
  @IsObject()
  @Type(() => ItemAttributes)
  item: ItemAttributes;

  @ApiProperty()
  @IsObject()
  @Type(() => VariantAttributes)
  variant: VariantAttributes;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @IsNumber()
  price: number;

  @ApiProperty()
  @IsNumber()
  subtotal: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  note: string;
}
