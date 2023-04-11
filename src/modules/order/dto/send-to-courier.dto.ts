import { OrderCourierAttributes } from '@albatrosdeveloper/ave-models-npm/lib/schemas/order/order.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsObject, IsString } from 'class-validator';

export class SendOrderToCourierDto {

    @ApiProperty({
        required: false,
    })
    @IsString()
    @IsNotEmpty()
    orderId: string;

    @ApiProperty()
    @IsObject()
    courier: OrderCourierAttributes;

    @ApiProperty({
        required: true,
    })
    @IsNumber()
    @IsNotEmpty()
    deliveryPrice: number;
}
